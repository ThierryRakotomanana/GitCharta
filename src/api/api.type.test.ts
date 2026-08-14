import { describe, it, expect } from "vitest";
import { isTerminalStatus, type JobStatus } from "./api.type";

describe("api.type Helpers", () => {
	it("should correctly identify terminal job statuses", () => {
		const terminalStatuses: JobStatus[] = [
			"completed",
			"partial",
			"failed",
			"cancelled"
		];
		const activeStatuses: JobStatus[] = ["pending", "running"];

		terminalStatuses.forEach((status) => {
			expect(isTerminalStatus(status)).toBe(true);
		});

		activeStatuses.forEach((status) => {
			expect(isTerminalStatus(status)).toBe(false);
		});
	});
});
