import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import {
	isValidLogin,
	createAudienceJob,
	getAudienceJob,
	cancelAudienceJob
} from "./jobs";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("jobs Service", () => {
	describe("isValidLogin", () => {
		it("should validate GitHub usernames correctly according to pattern constraints", () => {
			expect(isValidLogin("octocat")).toBe(true);
			expect(isValidLogin("octocat-dev")).toBe(true);
			expect(isValidLogin("-invalid")).toBe(false);
			expect(isValidLogin("invalid-")).toBe(false);
			expect(isValidLogin("a".repeat(40))).toBe(false);
		});
	});

	describe("API Clients (MSW Integration)", () => {
		it("should serialize request body correctly on createAudienceJob", async () => {
			let interceptedBody: unknown;

			server.use(
				http.post("*/api/audience/jobs", async ({ request }) => {
					interceptedBody = await request.json();
					return HttpResponse.json({ id: "job-1", status: "pending" });
				})
			);

			const result = await createAudienceJob("octocat", "followers");

			expect(interceptedBody).toEqual({ login: "octocat", type: "followers" });
			expect(result).toEqual({ id: "job-1", status: "pending" });
		});

		it("should issue a GET request to retrieve job status", async () => {
			server.use(
				http.get("*/api/audience/jobs/job-123", () => {
					return HttpResponse.json({ id: "job-123", status: "running" });
				})
			);

			const result = await getAudienceJob("job-123");
			expect(result).toEqual({ id: "job-123", status: "running" });
		});

		it("should send DELETE request on cancelAudienceJob", async () => {
			let methodUsed = "";

			server.use(
				http.delete("*/api/audience/jobs/job-101", ({ request }) => {
					methodUsed = request.method;
					return HttpResponse.json({ id: "job-101", status: "cancelled" });
				})
			);

			const result = await cancelAudienceJob("job-101");

			expect(methodUsed).toBe("DELETE");
			expect(result).toEqual({ id: "job-101", status: "cancelled" });
		});
	});
});
