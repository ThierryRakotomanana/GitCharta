import { apiClient } from "@/shared/api/client";
import type { UserProfileResponse } from "../model/types";

export function fetchUserProfile(
	login: string,
	signal?: AbortSignal
): Promise<UserProfileResponse> {
	return apiClient.get<UserProfileResponse>("/api/user", {
		params: { login },
		signal,
		timeoutMs: 15_000
	});
}
