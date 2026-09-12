// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { ApiError } from "@/shared/api/apiError";
import { githubAudienceService } from "../api/audienceService";
import type { AudienceJob, AudienceType } from "../model/types";
import { useAudienceJob } from "./useAudienceJob";

type QueryOptions = {
	queryFn: (context: { signal: AbortSignal }) => Promise<AudienceJob>;
	retry: (failureCount: number, err: unknown) => boolean;
};

const queryMocks = vi.hoisted(() => ({
	useQuery: vi.fn(),
	cancelQueries: vi.fn(),
	removeQueries: vi.fn()
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: queryMocks.useQuery,
	useQueryClient: () => ({
		cancelQueries: queryMocks.cancelQueries,
		removeQueries: queryMocks.removeQueries
	})
}));

function makeJob(login: string, type: AudienceType, id: string): AudienceJob {
	return {
		id,
		status: "pending",
		login,
		type,
		progress: { stage: "graphql", done: 0, total: null },
		result: null,
		error: "",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
}

function latestQueryOptions(): QueryOptions {
	return queryMocks.useQuery.mock.lastCall?.[0] as QueryOptions;
}

beforeEach(() => {
	queryMocks.useQuery.mockReturnValue({
		data: undefined,
		isError: false,
		isPending: false,
		isPaused: false,
		isFetching: false,
		failureCount: 0,
		error: null,
		refetch: vi.fn()
	});
	localStorage.clear();
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.clearAllMocks();
});

describe("useAudienceJob", () => {
	it("isolates job IDs when the active login changes", async () => {
		const createJob = vi
			.spyOn(githubAudienceService, "createJob")
			.mockImplementation(async (login, type) =>
				makeJob(login, type, `${login}-${type}`)
			);
		const getJob = vi
			.spyOn(githubAudienceService, "getJob")
			.mockResolvedValue(makeJob("alpha", "followers", "alpha-followers"));
		const controller = new AbortController();

		const { rerender } = renderHook(
			({ login }) => useAudienceJob(login, "followers", true),
			{ initialProps: { login: "alpha" } }
		);
		const alphaQuery = latestQueryOptions();
		await alphaQuery.queryFn({ signal: controller.signal });

		rerender({ login: "beta" });
		const betaQuery = latestQueryOptions();

		await alphaQuery.queryFn({ signal: controller.signal });
		await betaQuery.queryFn({ signal: controller.signal });

		expect(getJob).toHaveBeenCalledWith("alpha-followers", controller.signal);
		expect(createJob).toHaveBeenNthCalledWith(
			2,
			"beta",
			"followers",
			controller.signal
		);
	});

	it("resets the expired-job restart count for a new active key", async () => {
		let created = 0;
		const createJob = vi
			.spyOn(githubAudienceService, "createJob")
			.mockImplementation(async (login, type) => {
				created += 1;
				return makeJob(login, type, `${login}-${created}`);
			});
		vi.spyOn(githubAudienceService, "getJob").mockRejectedValue(
			new ApiError("Job not found", 404)
		);
		const controller = new AbortController();

		const { rerender } = renderHook(
			({ login }) => useAudienceJob(login, "followers", true),
			{ initialProps: { login: "alpha" } }
		);
		const alphaQuery = latestQueryOptions();
		await alphaQuery.queryFn({ signal: controller.signal });
		await alphaQuery.queryFn({ signal: controller.signal });
		await alphaQuery.queryFn({ signal: controller.signal });
		await alphaQuery.queryFn({ signal: controller.signal });

		localStorage.setItem("audience-job:beta:followers", "expired-beta");
		rerender({ login: "beta" });

		await expect(
			latestQueryOptions().queryFn({ signal: controller.signal })
		).resolves.toMatchObject({ login: "beta" });
		expect(createJob).toHaveBeenLastCalledWith(
			"beta",
			"followers",
			controller.signal
		);
	});

	it("retries only transient API failures up to the existing limit", () => {
		renderHook(() => useAudienceJob("octocat", "followers", true));
		const { retry } = latestQueryOptions();

		expect(retry(0, new ApiError("Request timed out", 0))).toBe(true);
		expect(retry(4, new ApiError("Network disconnected", 0))).toBe(true);
		expect(retry(0, new ApiError("Rate limited", 429))).toBe(true);
		expect(retry(5, new ApiError("Network disconnected", 0))).toBe(false);
		expect(retry(0, new ApiError("Request aborted", 0))).toBe(false);
		expect(retry(0, new ApiError("Invalid login", 400))).toBe(false);
		expect(retry(0, new ApiError("Unavailable", 503))).toBe(false);
		expect(retry(0, new Error("Job repeatedly expired"))).toBe(false);
		expect(retry(0, new Error("Invalid GitHub login"))).toBe(false);
	});
});
