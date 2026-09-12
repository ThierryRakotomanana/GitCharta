// @vitest-environment jsdom
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { GeocodeResult } from "@/shared/lib/geocode";
import { geocode } from "@/shared/lib/geocode";
import type { ProfileNode } from "@/shared/api/types";
import type { AudienceJob } from "@/features/audience/model/types";
import type { UserProfileResponse } from "@/features/user-profile/model/types";

const BASE = "http://localhost:8080";

vi.mock("@/shared/lib/geocode", () => ({
	geocode: vi.fn()
}));

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } }
	});
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

const BASE_PROFILE: ProfileNode = {
	login: "octocat",
	id: "u1",
	name: null,
	avatarUrl: "",
	url: "",
	company: null,
	location: null,
	twitterUsername: null,
	isSiteAdmin: false
};

function makeJob(overrides: Partial<AudienceJob> = {}): AudienceJob {
	return {
		id: overrides.id ?? "job-1",
		status: "pending",
		login: "octocat",
		type: "followers",
		progress: { stage: "graphql", done: 0, total: null },
		result: null,
		error: "",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		...overrides
	};
}

function makeUser(
	overrides: Partial<UserProfileResponse> = {}
): UserProfileResponse {
	return {
		login: "octocat",
		name: "The Octocat",
		avatarUrl: "https://example.com/avatar.png",
		url: "https://github.com/octocat",
		followersCount: 2,
		followingCount: 1,
		...overrides
	};
}

function makeGeocodeResult(overrides: Partial<GeocodeResult> = {}): GeocodeResult {
	return {
		profileCountryMap: new Map(),
		usersByCountry: new Map(),
		missingDictionaryMatches: new Map(),
		invalidOrSkippedLocations: new Map(),
		...overrides
	};
}

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
	server.resetHandlers();
	localStorage.clear();
	vi.clearAllMocks();
});
afterAll(() => server.close());

describe("useAudience Integration", () => {
	it("reaches success with a combined audience once both jobs and geocoding complete", async () => {
		const { useAudience } = await import("./useAudience");

		server.use(
			http.get(`${BASE}/api/user`, () => HttpResponse.json(makeUser())),
			http.post(`${BASE}/api/audience/jobs`, async ({ request }) => {
				const body = (await request.json()) as {
					login: string;
					type: "followers" | "following";
				};
				const id = body.type === "followers" ? "job-followers" : "job-following";
				return HttpResponse.json(
					makeJob({ id, type: body.type, status: "pending" }),
					{ status: 202 }
				);
			}),
			http.get(`${BASE}/api/audience/jobs/job-followers`, () =>
				HttpResponse.json(
					makeJob({
						id: "job-followers",
						type: "followers",
						status: "completed",
						progress: { stage: "backfill", done: 1, total: 1 },
						result: {
							nodes: [{ ...BASE_PROFILE, login: "alice", id: "a1" }],
							graphqlTotalCount: 1,
							restTotalCount: 1,
							recoveredLogins: [],
							unresolvedLogins: [],
							partial: false,
							resumeAfter: null
						}
					})
				)
			),
			http.get(`${BASE}/api/audience/jobs/job-following`, () =>
				HttpResponse.json(
					makeJob({
						id: "job-following",
						type: "following",
						status: "completed",
						progress: { stage: "backfill", done: 2, total: 2 },
						result: {
							nodes: [
								{ ...BASE_PROFILE, login: "alice", id: "a1" },
								{ ...BASE_PROFILE, login: "bob", id: "b1" }
							],
							graphqlTotalCount: 2,
							restTotalCount: 2,
							recoveredLogins: [],
							unresolvedLogins: [],
							partial: false,
							resumeAfter: null
						}
					})
				)
			)
		);

		vi.mocked(geocode).mockImplementation(async (_profiles, onProgress) => {
			onProgress({ done: 2, total: 2 });
			return makeGeocodeResult({
				profileCountryMap: new Map([
					["alice", "France"],
					["bob", "Belgium"]
				])
			});
		});

		const { result } = renderHook(() => useAudience({ user: "octocat" }), {
			wrapper: createWrapper()
		});

		await waitFor(() => expect(result.current.status).toBe("success"), {
			timeout: 12000
		});

		expect(result.current.audience?.followers.map((f) => f.login)).toEqual([
			"alice"
		]);
		expect(result.current.audience?.following.map((f) => f.login)).toEqual([
			"alice",
			"bob"
		]);
		expect(result.current.audience?.ghosts.map((f) => f.login)).toEqual(["bob"]);
		expect(
			result.current.audience?.following.find((f) => f.login === "bob")?.country
		).toBe("Belgium");
		expect(result.current.user?.login).toBe("octocat");
		expect(result.current.pct).toBe(100);
	}, 15000);

	it("moves to the error status when a job fails, without blocking on geocoding", async () => {
		const { useAudience } = await import("./useAudience");

		server.use(
			http.get(`${BASE}/api/user`, () => HttpResponse.json(makeUser())),
			http.post(`${BASE}/api/audience/jobs`, async ({ request }) => {
				const body = (await request.json()) as {
					login: string;
					type: "followers" | "following";
				};
				const id = body.type === "followers" ? "job-followers" : "job-following";
				return HttpResponse.json(
					makeJob({ id, type: body.type, status: "pending" }),
					{ status: 202 }
				);
			}),
			http.get(`${BASE}/api/audience/jobs/job-followers`, () =>
				HttpResponse.json(
					makeJob({
						id: "job-followers",
						type: "followers",
						status: "failed",
						error: "GitHub user not found"
					})
				)
			),
			http.get(`${BASE}/api/audience/jobs/job-following`, () =>
				HttpResponse.json(
					makeJob({ id: "job-following", type: "following", status: "running" })
				)
			)
		);

		const { result } = renderHook(() => useAudience({ user: "octocat" }), {
			wrapper: createWrapper()
		});

		await waitFor(() => expect(result.current.status).toBe("error"), {
			timeout: 12000
		});

		expect(result.current.error).toMatch(/GitHub user not found/i);
		expect(geocode).not.toHaveBeenCalled();
	}, 15000);

	it("does not refetch anything on remount once a login's data is cached (regression test for the original 'return to Map tab' bug)", async () => {
		const { useAudience } = await import("./useAudience");

		let createJobCalls = 0;
		let getUserCalls = 0;

		server.use(
			http.get(`${BASE}/api/user`, () => {
				getUserCalls++;
				return HttpResponse.json(makeUser());
			}),
			http.post(`${BASE}/api/audience/jobs`, async ({ request }) => {
				createJobCalls++;
				const body = (await request.json()) as {
					login: string;
					type: "followers" | "following";
				};
				const id = body.type === "followers" ? "job-followers" : "job-following";
				return HttpResponse.json(
					makeJob({ id, type: body.type, status: "pending" }),
					{ status: 202 }
				);
			}),
			http.get(`${BASE}/api/audience/jobs/job-followers`, () =>
				HttpResponse.json(
					makeJob({
						id: "job-followers",
						type: "followers",
						status: "completed",
						progress: { stage: "backfill", done: 1, total: 1 },
						result: {
							nodes: [{ ...BASE_PROFILE, login: "alice", id: "a1" }],
							graphqlTotalCount: 1,
							restTotalCount: 1,
							recoveredLogins: [],
							unresolvedLogins: [],
							partial: false,
							resumeAfter: null
						}
					})
				)
			),
			http.get(`${BASE}/api/audience/jobs/job-following`, () =>
				HttpResponse.json(
					makeJob({
						id: "job-following",
						type: "following",
						status: "completed",
						progress: { stage: "backfill", done: 1, total: 1 },
						result: {
							nodes: [{ ...BASE_PROFILE, login: "alice", id: "a1" }],
							graphqlTotalCount: 1,
							restTotalCount: 1,
							recoveredLogins: [],
							unresolvedLogins: [],
							partial: false,
							resumeAfter: null
						}
					})
				)
			)
		);

		vi.mocked(geocode).mockImplementation(async (_profiles, onProgress) => {
			onProgress({ done: 1, total: 1 });
			return makeGeocodeResult({
				profileCountryMap: new Map([["alice", "France"]])
			});
		});

		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } }
		});
		const wrapper = ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);

		const { result, unmount } = renderHook(() => useAudience({ user: "octocat" }), {
			wrapper
		});

		await waitFor(() => expect(result.current.status).toBe("success"), {
			timeout: 12000
		});

		expect(createJobCalls).toBe(2);
		expect(getUserCalls).toBe(1);

		unmount();
		const { result: secondMount } = renderHook(
			() => useAudience({ user: "octocat" }),
			{ wrapper }
		);

		expect(secondMount.current.status).toBe("success");
		expect(secondMount.current.user?.login).toBe("octocat");
		expect(secondMount.current.audience?.followers.map((f) => f.login)).toEqual([
			"alice"
		]);

		expect(createJobCalls).toBe(2);
		expect(getUserCalls).toBe(1);

		await new Promise((r) => setTimeout(r, 8000));
		expect(createJobCalls).toBe(2);
		expect(getUserCalls).toBe(1);
	}, 20000);

	it("is idle when no login is set", async () => {
		const { useAudience } = await import("./useAudience");

		const { result } = renderHook(() => useAudience({ user: "" }), {
			wrapper: createWrapper()
		});

		expect(result.current.status).toBe("idle");
	});

	it("retry() after a failure creates a fresh job and reaches success", async () => {
		const { useAudience } = await import("./useAudience");

		let followersAttempt = 0;

		server.use(
			http.get(`${BASE}/api/user`, () => HttpResponse.json(makeUser())),
			http.post(`${BASE}/api/audience/jobs`, async ({ request }) => {
				const body = (await request.json()) as {
					login: string;
					type: "followers" | "following";
				};
				if (body.type === "followers") {
					followersAttempt++;
					const id = followersAttempt === 1 ? "job-followers-1" : "job-followers-2";
					return HttpResponse.json(
						makeJob({ id, type: "followers", status: "pending" }),
						{ status: 202 }
					);
				}
				return HttpResponse.json(
					makeJob({ id: "job-following", type: "following", status: "pending" }),
					{ status: 202 }
				);
			}),
			http.get(`${BASE}/api/audience/jobs/job-followers-1`, () =>
				HttpResponse.json(
					makeJob({
						id: "job-followers-1",
						type: "followers",
						status: "failed",
						error: "GitHub user not found"
					})
				)
			),
			http.get(`${BASE}/api/audience/jobs/job-followers-2`, () =>
				HttpResponse.json(
					makeJob({
						id: "job-followers-2",
						type: "followers",
						status: "completed",
						progress: { stage: "backfill", done: 1, total: 1 },
						result: {
							nodes: [{ ...BASE_PROFILE, login: "alice", id: "a1" }],
							graphqlTotalCount: 1,
							restTotalCount: 1,
							recoveredLogins: [],
							unresolvedLogins: [],
							partial: false,
							resumeAfter: null
						}
					})
				)
			),
			http.get(`${BASE}/api/audience/jobs/job-following`, () =>
				HttpResponse.json(
					makeJob({
						id: "job-following",
						type: "following",
						status: "completed",
						progress: { stage: "backfill", done: 1, total: 1 },
						result: {
							nodes: [{ ...BASE_PROFILE, login: "alice", id: "a1" }],
							graphqlTotalCount: 1,
							restTotalCount: 1,
							recoveredLogins: [],
							unresolvedLogins: [],
							partial: false,
							resumeAfter: null
						}
					})
				)
			)
		);

		vi.mocked(geocode).mockImplementation(async (_profiles, onProgress) => {
			onProgress({ done: 1, total: 1 });
			return makeGeocodeResult({
				profileCountryMap: new Map([["alice", "France"]])
			});
		});

		const { result } = renderHook(() => useAudience({ user: "octocat" }), {
			wrapper: createWrapper()
		});

		await waitFor(() => expect(result.current.status).toBe("error"), {
			timeout: 12000
		});
		expect(followersAttempt).toBe(1);

		result.current.retry();

		await waitFor(() => expect(result.current.status).toBe("success"), {
			timeout: 12000
		});

		expect(followersAttempt).toBe(2);
		expect(result.current.audience?.followers.map((f) => f.login)).toEqual([
			"alice"
		]);
	}, 20000);
});
