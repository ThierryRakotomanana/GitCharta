import { ApiError } from "@/api/api.errors";
import type { ApiErrorBody } from "./api.type";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type QueueItem<T> = {
	run: () => Promise<T>;
	resolve: (value: T) => void;
	reject: (reason: unknown) => void;
	attempts: number;
};

const MAX_QUEUE_RETRIES_ON_429 = 6;

export class RequestQueue {
	private items: QueueItem<unknown>[] = [];
	private draining = false;
	private notBeforeMs = 0;

	constructor(private readonly minIntervalMs: number) {}

	reset() {
		this.items = [];
		this.draining = false;
		this.notBeforeMs = 0;
	}

	enqueue<T>(run: () => Promise<T>, signal?: AbortSignal): Promise<T> {
		if (signal?.aborted) {
			return Promise.reject(new ApiError("Request aborted", 0, null, null));
		}

		return new Promise<T>((resolve, reject) => {
			const item: QueueItem<unknown> = {
				run,
				resolve: resolve as (value: unknown) => void,
				reject,
				attempts: 0
			};

			const onAbort = () => {
				const idx = this.items.indexOf(item);
				if (idx !== -1) {
					this.items.splice(idx, 1);
				}
				reject(new ApiError("Request aborted", 0, null, null));
			};

			const detach = () => signal?.removeEventListener("abort", onAbort);

			if (signal) {
				signal.addEventListener("abort", onAbort, { once: true });
			}

			item.resolve = ((value: unknown) => {
				detach();
				resolve(value as T);
			}) as (value: unknown) => void;
			item.reject = (reason: unknown) => {
				detach();
				reject(reason);
			};

			this.items.push(item);
			void this.drain();
		});
	}

	private async drain() {
		if (this.draining) return;
		this.draining = true;
		try {
			while (this.items.length > 0) {
				const wait = this.notBeforeMs - Date.now();
				if (wait > 0) await sleep(wait);

				const item = this.items.shift()!;
				try {
					const result = await item.run();
					this.notBeforeMs = Date.now() + this.minIntervalMs;
					item.resolve(result);
				} catch (err) {
					if (
						err instanceof ApiError
						&& err.isRateLimited
						&& item.attempts < MAX_QUEUE_RETRIES_ON_429
					) {
						item.attempts += 1;
						const backoff =
							err.retryAfterMs ?? this.minIntervalMs * 2 ** item.attempts;
						this.notBeforeMs = Date.now() + backoff;
						this.items.unshift(item);
						continue;
					}
					this.notBeforeMs = Date.now() + this.minIntervalMs;
					item.reject(err);
				}
			}
		} finally {
			this.draining = false;
		}
	}
}

export const requestQueue = new RequestQueue(1500);

function parseRetryAfterMs(header: string | null): number | null {
	if (!header) return null;
	const asSeconds = Number(header);
	if (!Number.isNaN(asSeconds)) return Math.max(0, asSeconds * 1000);
	const asDate = Date.parse(header);
	if (!Number.isNaN(asDate)) return Math.max(0, asDate - Date.now());
	return null;
}

export async function apiRequest<T>(
	input: string | URL,
	init: RequestInit,
	timeoutMs = 45_000
): Promise<T> {
	return requestQueue.enqueue(async () => {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

		const externalSignal = init.signal;
		const onExternalAbort = () => controller.abort();
		if (externalSignal) {
			if (externalSignal.aborted) controller.abort();
			else
				externalSignal.addEventListener("abort", onExternalAbort, { once: true });
		}

		try {
			const response = await fetch(input, { ...init, signal: controller.signal });

			if (!response.ok) {
				const retryAfterMs = parseRetryAfterMs(response.headers.get("Retry-After"));
				let message = `Request failed with status ${response.status}`;
				let resetAt: Date | null = null;
				try {
					const body = (await response.json()) as ApiErrorBody;
					if (body?.error) message = body.error;
					if (body?.resetAt) {
						const parsed = new Date(body.resetAt);
						if (!Number.isNaN(parsed.getTime())) resetAt = parsed;
					}
				} catch {
					console.warn("Non JSON error Body", response.body);
				}
				throw new ApiError(message, response.status, retryAfterMs, resetAt);
			}

			if (response.status === 204) return undefined as T;
			return (await response.json()) as T;
		} catch (error) {
			if (error instanceof ApiError) throw error;
			if (error instanceof DOMException && error.name === "AbortError") {
				const callerAborted = externalSignal?.aborted ?? false;
				throw new ApiError(
					callerAborted ? "Request aborted" : "Request timed out",
					0,
					null,
					null,
					error
				);
			}
			throw new ApiError(
				error instanceof Error ? error.message : "Network error",
				0,
				null,
				null,
				error
			);
		} finally {
			clearTimeout(timeoutId);
			if (externalSignal)
				externalSignal.removeEventListener("abort", onExternalAbort);
		}
	}, init.signal ?? undefined);
}
