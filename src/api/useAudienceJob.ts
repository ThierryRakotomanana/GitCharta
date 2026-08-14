import { useCallback, useEffect, useRef, useState } from "react";
import {
	createAudienceJob,
	getAudienceJob,
	cancelAudienceJob,
	isValidLogin
} from "./jobs";
import { jobStorage } from "./jobStorage";
import type { AudienceJob, AudienceType } from "./api.type";
import { isTerminalStatus } from "./api.type";
import { ApiError } from "@/api/api.errors";

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

const initialState: AudienceJobState = {
	phase: "idle",
	job: null,
	connectionIssue: false,
	error: null,
	resetAt: null
};

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

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve) => {
		if (signal?.aborted) {
			resolve();
			return;
		}
		const timeoutId = setTimeout(resolve, ms);
		signal?.addEventListener(
			"abort",
			() => {
				clearTimeout(timeoutId);
				resolve();
			},
			{ once: true }
		);
	});
}

export function useAudienceJob(
	login: string,
	type: AudienceType,
	enabled: boolean
) {
	const [state, setState] = useState<AudienceJobState>(initialState);

	const mountedRef = useRef(true);
	const jobIdRef = useRef<string | null>(null);
	const failureStreakRef = useRef(0);
	const generationRef = useRef(0);
	const abortRef = useRef<AbortController | null>(null);

	const isCurrent = useCallback(
		(generation: number) =>
			generation === generationRef.current && mountedRef.current,
		[]
	);

	const runLifecycle = useCallback(
		async (generation: number, notice?: string): Promise<void> => {
			if (!isValidLogin(login)) {
				setState({
					phase: "error",
					job: null,
					connectionIssue: false,
					error: `"${login}" is not a valid GitHub login.`,
					resetAt: null
				});
				return;
			}

			let jobId = jobStorage.read(login, type);

			if (jobId) {
				jobIdRef.current = jobId;
				setState({
					phase: "pending",
					job: null,
					connectionIssue: false,
					error: notice ?? null,
					resetAt: null
				});
			} else {
				setState({
					phase: "creating",
					job: null,
					connectionIssue: false,
					error: notice ?? null,
					resetAt: null
				});
				try {
					const job = await createAudienceJob(login, type);
					if (!isCurrent(generation)) return;

					jobIdRef.current = job.id;
					jobId = job.id;
					setState({
						phase: job.status,
						job,
						connectionIssue: false,
						error: null,
						resetAt: null
					});

					if (isTerminalStatus(job.status)) {
						jobStorage.clear(login, type);
						return;
					}
					jobStorage.write(login, type, job.id);
				} catch (err) {
					if (!isCurrent(generation)) return;
					const { message, resetAt } = messageForCreateFailure(err);
					setState({
						phase: "error",
						job: null,
						connectionIssue: false,
						error: message,
						resetAt
					});
					return;
				}
			}

			while (isCurrent(generation)) {
				try {
					const job = await getAudienceJob(jobId);
					if (!isCurrent(generation)) return;

					failureStreakRef.current = 0;
					setState({
						phase: job.status,
						job,
						connectionIssue: false,
						error: job.status === "failed" ? job.error || "Job failed" : null,
						resetAt: null
					});

					if (isTerminalStatus(job.status)) {
						jobStorage.clear(login, type);
						return;
					}
					await delay(POLL_INTERVAL_MS, abortRef.current?.signal);
				} catch (err) {
					if (!isCurrent(generation)) return;
					if (err instanceof ApiError && err.isAborted) return;

					if (err instanceof ApiError && err.isNotFound) {
						jobStorage.clear(login, type);
						jobIdRef.current = null;
						return runLifecycle(
							generation,
							"Previous job expired — restarting fetch…"
						);
					}

					failureStreakRef.current += 1;
					const warn = failureStreakRef.current >= FAILURE_STREAK_FOR_WARNING;
					setState((s) => ({
						...s,
						connectionIssue: warn,
						error:
							warn ?
								err instanceof ApiError ?
									err.message
								:	"Connection issue"
							:	s.error
					}));

					const backoff = Math.min(
						POLL_INTERVAL_MS * 2 ** failureStreakRef.current,
						MAX_BACKOFF_MS
					);
					await delay(backoff, abortRef.current?.signal);
				}
			}
		},
		[login, type, isCurrent]
	);

	const cancel = useCallback(async () => {
		generationRef.current += 1;
		abortRef.current?.abort();
		const jobId = jobIdRef.current;
		jobStorage.clear(login, type);
		if (!jobId) {
			setState(initialState);
			return;
		}
		try {
			await cancelAudienceJob(jobId);
		} catch (err) {
			if (err instanceof ApiError && (err.status === 409 || err.status === 404)) {
				return;
			}

			if (err instanceof ApiError && err.message === "Request aborted") {
				return;
			}

			console.warn("Failed to cancel audience job:", err);
		} finally {
			jobIdRef.current = null;
			if (mountedRef.current) {
				setState({
					phase: "cancelled",
					job: null,
					connectionIssue: false,
					error: null,
					resetAt: null
				});
			}
		}
	}, [login, type]);

	const stopPolling = useCallback(() => {
		generationRef.current += 1;
		abortRef.current?.abort();
	}, []);

	const restart = useCallback(() => {
		generationRef.current += 1;
		abortRef.current?.abort();
		const generation = generationRef.current;
		abortRef.current = new AbortController();
		jobIdRef.current = null;
		failureStreakRef.current = 0;
		jobStorage.clear(login, type);
		void runLifecycle(generation);
	}, [login, type, runLifecycle]);

	useEffect(() => {
		mountedRef.current = true;
		if (!enabled || !login) {
			setState(initialState);
			return;
		}
		generationRef.current += 1;
		abortRef.current = new AbortController();
		failureStreakRef.current = 0;
		void runLifecycle(generationRef.current);

		return () => {
			mountedRef.current = false;
			stopPolling();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enabled, login, type]);

	return { ...state, cancel, restart, stopPolling };
}
