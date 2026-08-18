import { apiRequest } from "../shared/api/requestQueue";
import type { UserProfileResponse } from "./api.type";
import { API_BASE_URL } from "@/config";

export function fetchUserProfile(
	login: string,
	signal?: AbortSignal
): Promise<UserProfileResponse> {
	const url = new URL("/api/user", API_BASE_URL);
	url.searchParams.set("login", login);
	return apiRequest<UserProfileResponse>(
		url,
		{ method: "GET", headers: { Accept: "application/json" }, signal },
		15_000
	);
}
