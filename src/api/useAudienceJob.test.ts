// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAudienceJob } from "./useAudienceJob";
import { createAudienceJob, getAudienceJob, cancelAudienceJob } from "./jobs";
import { jobStorage } from "./jobStorage";
import { ApiError } from "@/api/api.errors";
import type { AudienceJob } from "./api.type";

vi.mock("./jobs", () => ({
	createAudienceJob: vi.fn(),
	getAudienceJob: vi.fn(),
	cancelAudienceJob: vi.fn(),
	isValidLogin: vi.fn(() => true)
}));

vi.mock("./jobStorage", () => ({
	jobStorage: { read: vi.fn(), write: vi.fn(), clear: vi.fn() }
}));

describe("useAudienceJob Hook — Critical Safety & Lifecycle Guarantees", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
	});

	it("should remain idle and make zero network or storage calls when disabled", () => {
		const { result } = renderHook(() =>
			useAudienceJob("ThierryRkt", "followers", false)
		);

		expect(result.current.phase).toBe("idle");
		expect(createAudienceJob).not.toHaveBeenCalled();
		expect(jobStorage.read).not.toHaveBeenCalled();
	});

	it("should resume an existing job from storage without re-creating a duplicate job", async () => {
		vi.mocked(jobStorage.read).mockReturnValue("stored-job-123");
		vi.mocked(getAudienceJob).mockResolvedValue({
			id: "stored-job-123",
			status: "running"
		} as AudienceJob);

		const { result } = renderHook(() =>
			useAudienceJob("ThierryRkt", "followers", true)
		);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
		});

		expect(getAudienceJob).toHaveBeenCalledWith("stored-job-123");
		expect(createAudienceJob).not.toHaveBeenCalled();
		expect(result.current.phase).toBe("running");
	});

	it("should create a job, poll until completed, and clear storage on terminal state", async () => {
		vi.mocked(jobStorage.read).mockReturnValue(null);

		vi.mocked(createAudienceJob).mockResolvedValue({
			id: "job-999",
			status: "running"
		} as AudienceJob);

		vi.mocked(getAudienceJob)
			.mockResolvedValueOnce({ id: "job-999", status: "running" } as AudienceJob)
			.mockResolvedValueOnce({ id: "job-999", status: "completed" } as AudienceJob);

		const { result } = renderHook(() =>
			useAudienceJob("ThierryRkt", "followers", true)
		);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
		});

		expect(jobStorage.write).toHaveBeenCalledWith(
			"ThierryRkt",
			"followers",
			"job-999"
		);
		expect(getAudienceJob).toHaveBeenCalledTimes(1);
		expect(result.current.phase).toBe("running");

		await act(async () => {
			await vi.advanceTimersToNextTimerAsync();
		});

		expect(getAudienceJob).toHaveBeenCalledTimes(2);
		expect(result.current.phase).toBe("completed");

		expect(jobStorage.clear).toHaveBeenCalledWith("ThierryRkt", "followers");
	});

	it("should clear storage and restart creation if backend returns 404 for an expired job", async () => {
		vi.mocked(jobStorage.read)
			.mockReturnValueOnce("expired-job-id")
			.mockReturnValue(null);

		vi.mocked(getAudienceJob).mockRejectedValueOnce(
			new ApiError("Job not found", 404, null, null)
		);

		vi.mocked(createAudienceJob).mockResolvedValue({
			id: "fresh-job-id",
			status: "running"
		} as AudienceJob);

		const { result } = renderHook(() =>
			useAudienceJob("ThierryRkt", "followers", true)
		);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
		});

		expect(jobStorage.clear).toHaveBeenCalledWith("ThierryRkt", "followers");
		expect(createAudienceJob).toHaveBeenCalledWith("ThierryRkt", "followers");
		expect(result.current.phase).toBe("running");
	});

	it("should stop polling, inform backend, clear storage, and set state to cancelled when cancel() is called", async () => {
		vi.mocked(jobStorage.read).mockReturnValue(null);
		vi.mocked(createAudienceJob).mockResolvedValue({
			id: "job-to-cancel",
			status: "running"
		} as AudienceJob);

		const { result } = renderHook(() =>
			useAudienceJob("ThierryRkt", "followers", true)
		);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
		});
		expect(result.current.phase).toBe("running");

		await act(async () => {
			await result.current.cancel();
		});

		expect(cancelAudienceJob).toHaveBeenCalledWith("job-to-cancel");
		expect(jobStorage.clear).toHaveBeenCalledWith("ThierryRkt", "followers");
		expect(result.current.phase).toBe("cancelled");

		vi.mocked(getAudienceJob).mockClear();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(10_000);
		});

		expect(getAudienceJob).not.toHaveBeenCalled();
	});

	it("should safely halt and set phase to 'error' if API throws a 500", async () => {
		vi.mocked(jobStorage.read).mockReturnValue(null);

		vi.mocked(createAudienceJob).mockRejectedValueOnce(
			new ApiError("Internal Server Error", 500, null, null)
		);

		const { result } = renderHook(() =>
			useAudienceJob("ThierryRkt", "followers", true)
		);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
		});

		expect(result.current.phase).toBe("error");
		expect(result.current.error).toBe("Internal Server Error");
		expect(getAudienceJob).not.toHaveBeenCalled();
	});
});
