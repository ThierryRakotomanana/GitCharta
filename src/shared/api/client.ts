import { apiRequest } from "./requestQueue";
import { API_BASE_URL } from "@/config";

type RequestOpts = {
	params?: Record<string, string>;
	signal?: AbortSignal;
	timeoutMs?: number;
};

function buildUrl(path: string, params?: Record<string, string>): URL {
	const url = new URL(path, API_BASE_URL);
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.set(key, value);
		}
	}
	return url;
}

export const apiClient = {
	get<T>(path: string, opts: RequestOpts = {}): Promise<T> {
		return apiRequest<T>(
			buildUrl(path, opts.params),
			{
				method: "GET",
				headers: { Accept: "application/json" },
				signal: opts.signal
			},
			opts.timeoutMs
		);
	},

	post<T>(path: string, body: unknown, opts: RequestOpts = {}): Promise<T> {
		return apiRequest<T>(
			buildUrl(path, opts.params),
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Accept": "application/json"
				},
				body: JSON.stringify(body),
				signal: opts.signal
			},
			opts.timeoutMs
		);
	},

	delete<T>(path: string, opts: RequestOpts = {}): Promise<T> {
		return apiRequest<T>(
			buildUrl(path, opts.params),
			{
				method: "DELETE",
				headers: { Accept: "application/json" },
				signal: opts.signal
			},
			opts.timeoutMs
		);
	}
};
