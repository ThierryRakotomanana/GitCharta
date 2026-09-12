import { useCallback, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { githubAudienceService } from "../api/audienceService";
import { isValidLogin } from "../model/validateLogin";
import { jobStorage } from "../api/jobStorage";
import type { AudienceJob, AudienceType } from "../model/types";
import { isTerminalStatus } from "../model/types";
import { ApiError } from "@/shared/api/apiError";

const POLL_INTERVAL_MS = 2000;
const MAX_BACKOFF_MS = 30_000;
const FAILURE_STREAK_FOR_WARNING = 3;

export type JobPhase = "idle" | "creating" | AudienceJob["status"] | "error";

export type AudienceJobState = {
	phase: JobPhase;
	job: AudienceJob | null;
	connectionIssue: boolean;
	error: string | null;
	resetAt: Date | null;
};

function queryKey(login: string, type: AudienceType) {
	return ["audience-job", login.toLowerCase(), type] as const;
}

function messageForCreateFailure(err: unknown): {
	message: string;
	resetAt: Date | null;
} {
	if (err instanceof ApiError) {
		if (err.isServiceUnavailable) {
			return {
				message: "Server is at capacity — please try again shortly.",
				resetAt: err.resetAt
			};
		}
		return { message: err.message, resetAt: err.resetAt };
	}
	return { message: "Failed to start the fetch.", resetAt: null };
}

export function useAudienceJob(
	login: string,
	type: AudienceType,
	enabled: boolean
) {
	const queryClient = useQueryClient();
	const jobIdRef = useRef<string | null>(null);
	const restartCountRef = useRef(0);
	const [cancelledKey, setCancelledKey] = useState<string | null>(null);

	const activeKeyStr = `${login}:${type}`;
	const isCancelled = cancelledKey === activeKeyStr;

	const query = useQuery({
		queryKey: queryKey(login, type),
		queryFn: async ({ signal }): Promise<AudienceJob> => {
			if (!isValidLogin(login)) {
				throw new Error(`"${login}" is not a valid GitHub login.`);
			}

			const jobId = jobIdRef.current ?? jobStorage.read(login, type);

			if (!jobId) {
				const job = await githubAudienceService.createJob(login, type, signal);
				jobIdRef.current = job.id;
				if (isTerminalStatus(job.status)) {
					jobStorage.clear(login, type);
				} else {
					jobStorage.write(login, type, job.id);
				}
				return job;
			}

			jobIdRef.current = jobId;

			try {
				const job = await githubAudienceService.getJob(jobId, signal);
				restartCountRef.current = 0;
				if (isTerminalStatus(job.status)) {
					jobStorage.clear(login, type);
				}
				return job;
			} catch (err) {
				if (err instanceof ApiError && err.isNotFound) {
					if (restartCountRef.current >= 3) {
						throw new Error("Job repeatedly expired, please try again later.", {
							cause: err
						});
					}
					restartCountRef.current += 1;
					jobStorage.clear(login, type);
					jobIdRef.current = null;
					const job = await githubAudienceService.createJob(login, type, signal);
					jobIdRef.current = job.id;
					if (isTerminalStatus(job.status)) {
						jobStorage.clear(login, type);
					} else {
						jobStorage.write(login, type, job.id);
					}
					return job;
				}
				throw err;
			}
		},
		enabled: enabled && !!login && !isCancelled,
		refetchInterval: (q) => {
			const status = q.state.data?.status;
			if (!status || isTerminalStatus(status)) return false;
			return POLL_INTERVAL_MS;
		},
		staleTime: (q) => {
			const status = q.state.data?.status;
			return status && isTerminalStatus(status) ? Infinity : 0;
		},
		retry: 5,
		retryDelay: (attemptIndex) =>
			Math.min(POLL_INTERVAL_MS * 2 ** attemptIndex, MAX_BACKOFF_MS)
	});

	const phase: JobPhase =
		!enabled || !login || isCancelled ? "idle"
		: query.isError ? "error"
		: !query.data && query.isPending ? "creating"
		: (query.data?.status ?? "idle");

	const createFailure =
		query.error instanceof Error ? messageForCreateFailure(query.error) : null;

	const state: AudienceJobState = {
		phase,
		job: isCancelled ? null : (query.data ?? null),
		connectionIssue:
			!isCancelled
			&& (query.isPaused
				|| (query.isFetching && query.failureCount >= FAILURE_STREAK_FOR_WARNING)),
		error:
			isCancelled ? null
			: createFailure ? createFailure.message
			: query.data?.status === "failed" ? query.data.error || "Job failed"
			: null,
		resetAt: isCancelled ? null : (createFailure?.resetAt ?? null)
	};

	const cancel = useCallback(async () => {
		setCancelledKey(activeKeyStr);
		const jobId = jobIdRef.current;
		jobStorage.clear(login, type);
		jobIdRef.current = null;
		restartCountRef.current = 0;

		if (jobId) {
			try {
				await githubAudienceService.cancelJob(jobId);
			} catch (err) {
				if (err instanceof ApiError && (err.status === 409 || err.status === 404)) {
					console.warn(err);
				} else if (err instanceof ApiError && err.isAborted) {
					console.warn("Cancelled locally", err);
				} else {
					console.warn("Failed to cancel audience job:", err);
				}
			}
		}

		await queryClient.cancelQueries({ queryKey: queryKey(login, type) });
		queryClient.removeQueries({ queryKey: queryKey(login, type) });
	}, [login, type, queryClient, activeKeyStr]);

	const restart = useCallback(() => {
		setCancelledKey(null);
		jobStorage.clear(login, type);
		jobIdRef.current = null;
		restartCountRef.current = 0;
		queryClient.removeQueries({ queryKey: queryKey(login, type) });
		void query.refetch();
	}, [login, type, queryClient, query]);

	return { ...state, cancel, restart };
}
