import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { apiRequest } from "./requestQueue";

const server = setupServer();

beforeAll(() => {
	if (typeof window !== "undefined") {
		Object.defineProperty(window, "location", {
			value: new URL("http://localhost"),
			writable: true
		});
	}
	server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("apiRequest & RequestQueue Integration", () => {
	it("should parse JSON on successful GET request", async () => {
		server.use(
			http.get("http://localhost/api/user", () => {
				return HttpResponse.json({ login: "octocat", name: "The Octocat" });
			})
		);

		const data = await apiRequest<{ login: string; name: string }>(
			"http://localhost/api/user",
			{ method: "GET" }
		);

		expect(data).toEqual({ login: "octocat", name: "The Octocat" });
	});

	it("should automatically retry 429 rate limits and succeed when backend recovers", async () => {
		let attempts = 0;

		server.use(
			http.get("http://localhost/api/audience/jobs/123", () => {
				attempts++;
				if (attempts === 1) {
					return HttpResponse.json(
						{ error: "Rate limit exceeded" },
						{ status: 429, headers: { "Retry-After": "0" } }
					);
				}
				return HttpResponse.json({ id: "123", status: "completed" });
			})
		);

		const data = await apiRequest<{ id: string; status: string }>(
			"http://localhost/api/audience/jobs/123",
			{ method: "GET" }
		);

		expect(attempts).toBe(2);
		expect(data).toEqual({ id: "123", status: "completed" });
	});

	it("should immediately throw ApiError on non-retryable 503 errors", async () => {
		server.use(
			http.post("http://localhost/api/audience/jobs", () => {
				return HttpResponse.json(
					{ error: "Worker pool saturated" },
					{ status: 503 }
				);
			})
		);

		await expect(
			apiRequest("http://localhost/api/audience/jobs", { method: "POST" })
		).rejects.toMatchObject({
			status: 503,
			isServiceUnavailable: true,
			message: "Worker pool saturated"
		});
	});

	it("should handle client-side AbortSignal cancellations cleanly", async () => {
		server.use(
			http.get("http://localhost/api/slow", () => {
				return HttpResponse.json({ status: "ok" });
			})
		);

		const controller = new AbortController();
		controller.abort();

		await expect(
			apiRequest("http://localhost/api/slow", {
				method: "GET",
				signal: controller.signal
			})
		).rejects.toMatchObject({
			status: 0,
			isAborted: true,
			message: "Request aborted"
		});
	});
});
