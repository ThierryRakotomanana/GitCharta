// @vitest-environment jsdom
import { jobStorage } from "@/features/audience/api/jobStorage";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("jobStorage Service", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should write, read, and clear job IDs in localStorage", () => {
		jobStorage.write("ThierryRakt", "followers", "job-123");
		expect(jobStorage.read("ThierryRakt", "followers")).toBe("job-123");

		jobStorage.clear("ThierryRakt", "followers");
		expect(jobStorage.read("ThierryRakt", "followers")).toBeNull();
	});

	it("should gracefully handle localStorage exceptions without crashing", () => {
		vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
			throw new DOMException("SecurityError", "SecurityError");
		});

		expect(() => jobStorage.read("ThierryRakt", "followers")).not.toThrow();
		expect(jobStorage.read("ThierryRakt", "followers")).toBeNull();
	});
});
