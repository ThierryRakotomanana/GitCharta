// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import {
	describe,
	it,
	expect,
	beforeAll,
	afterAll,
	beforeEach,
	afterEach,
	vi
} from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse, delay } from "msw";
import { useUserProfile } from "./useUserProfile";
import { requestQueue } from "./requestQueue";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

beforeEach(() => {
	requestQueue.reset();
});

afterEach(() => {
	server.resetHandlers();
	vi.restoreAllMocks();
});

afterAll(() => server.close());

describe("useUserProfile Hook", () => {
	it("should return null immediately without making network calls when login is empty", () => {
		const { result } = renderHook(() => useUserProfile(""));
		expect(result.current).toBeNull();
	});

	it("should fetch user profile data and update state through the real fetch pipeline", async () => {
		server.use(
			http.get("*/api/user", ({ request }) => {
				const url = new URL(request.url);
				const login = url.searchParams.get("login");

				return HttpResponse.json({
					login: login || "ThierryRakotomanana",
					name: "The ThierryRakotomanana",
					avatarUrl: "https://github.com/ThierryRakotomanana.png",
					url: "https://github.com/ThierryRakotomanana",
					followersCount: 100,
					followingCount: 50
				});
			})
		);

		const { result } = renderHook(() => useUserProfile("ThierryRakotomanana"));

		await waitFor(() => {
			expect(result.current).toEqual({
				login: "ThierryRakotomanana",
				name: "The ThierryRakotomanana",
				avatarUrl: "https://github.com/ThierryRakotomanana.png",
				url: "https://github.com/ThierryRakotomanana",
				followersCount: 100,
				followingCount: 50
			});
		});
	});

	it("should fallback to null gracefully on HTTP error response (e.g., 404 or 500)", async () => {
		server.use(
			http.get("*/api/user", () => {
				return new HttpResponse(null, { status: 404 });
			})
		);

		const { result } = renderHook(() => useUserProfile("non-existent-user"));

		await waitFor(() => {
			expect(result.current).toBeNull();
		});
	});

	it("should abort in-flight network request when unmounted before completion", async () => {
		server.use(
			http.get("*/api/user", async () => {
				await delay("infinite");
				return HttpResponse.json({ login: "ThierryRakotomanana" });
			})
		);

		const fetchSpy = vi.spyOn(globalThis, "fetch");

		const { unmount } = renderHook(() => useUserProfile("ThierryRakotomanana"));

		await waitFor(() => {
			expect(fetchSpy).toHaveBeenCalled();
		});

		const fetchOptions = fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined;
		const activeSignal = fetchOptions?.signal as AbortSignal | undefined;

		expect(activeSignal).toBeDefined();
		expect(activeSignal?.aborted).toBe(false);

		unmount();

		expect(activeSignal?.aborted).toBe(true);
	});
});
