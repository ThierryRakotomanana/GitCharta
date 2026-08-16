// @vitest-environment jsdom
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi
} from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type {
	AudienceJob,
	ProfileNode,
	UserProfileResponse
} from "../api/api.type";
import type { GeocodeResult } from "../shared/lib/geocode";
import { geocode } from "../shared/lib/geocode";

const BASE = "http://localhost:8080";

vi.mock("../lib/geocode", () => ({
	geocode: vi.fn()
}));

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
beforeEach(() => {
	vi.resetModules();
});
afterEach(() => {
	server.resetHandlers();
	localStorage.clear();
	vi.clearAllMocks();
});
afterAll(() => server.close());

describe("useAudience Integration", () => {
	it("reaches success with a combined audience once both jobs and geocoding complete", async () => {
		const { useAudience } = await import("../api/useAudience");

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

		const { result } = renderHook(() => useAudience({ user: "octocat" }));

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
		const { useAudience } = await import("../api/useAudience");

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

		const { result } = renderHook(() => useAudience({ user: "octocat" }));

		await waitFor(() => expect(result.current.status).toBe("error"), {
			timeout: 12000
		});

		expect(result.current.error).toMatch(/GitHub user not found/i);
		expect(geocode).not.toHaveBeenCalled();
	}, 15000);

	it("is idle when no login is set", async () => {
		const { useAudience } = await import("../api/useAudience");

		const { result } = renderHook(() => useAudience({ user: "" }));

		expect(result.current.status).toBe("idle");
	});
});
