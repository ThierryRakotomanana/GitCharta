export class ApiError extends Error {
	readonly status: number;
	readonly retryAfterMs: number | null;
	readonly resetAt: Date | null;
	readonly cause?: unknown;

	constructor(
		message: string,
		status: number,
		retryAfterMs: number | null = null,
		resetAt: Date | null = null,
		cause?: unknown
	) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.retryAfterMs = retryAfterMs;
		this.resetAt = resetAt;
		this.cause = cause;
	}

	get isTimeout() {
		return this.status === 0 && this.message === "Request timed out";
	}
	get isAborted() {
		return this.status === 0 && this.message === "Request aborted";
	}
	get isNotFound() {
		return this.status === 404;
	}
	get isRateLimited() {
		return this.status === 429;
	}
	get isBadRequest() {
		return this.status === 400;
	}
	get isConflict() {
		return this.status === 409;
	}
	get isServiceUnavailable() {
		return this.status === 503;
	}
}
