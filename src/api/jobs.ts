import { apiRequest } from "../shared/api/requestQueue";
import type { AudienceJob, AudienceType } from "./api.type";
import { API_BASE_URL } from "@/config";

const LOGIN_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
export function isValidLogin(login: string): boolean {
	return LOGIN_PATTERN.test(login);
}

export function createAudienceJob(
	login: string,
	type: AudienceType,
	signal?: AbortSignal
): Promise<AudienceJob> {
	const url = new URL("/api/audience/jobs", API_BASE_URL);
	return apiRequest<AudienceJob>(
		url,
		{
			method: "POST",
			headers: { "Content-Type": "application/json", "Accept": "application/json" },
			body: JSON.stringify({ login, type }),
			signal
		},
		20_000
	);
}

export function getAudienceJob(
	id: string,
	signal?: AbortSignal
): Promise<AudienceJob> {
	const url = new URL(`/api/audience/jobs/${encodeURIComponent(id)}`, API_BASE_URL);
	return apiRequest<AudienceJob>(url, {
		method: "GET",
		headers: { Accept: "application/json" },
		signal
	});
}

export function cancelAudienceJob(
	id: string,
	signal?: AbortSignal
): Promise<AudienceJob> {
	const url = new URL(`/api/audience/jobs/${encodeURIComponent(id)}`, API_BASE_URL);
	return apiRequest<AudienceJob>(url, {
		method: "DELETE",
		headers: { Accept: "application/json" },
		signal
	});
}
