import type { UserProfileResponse } from "@/features/user-profile";
import { apiClient } from "@/shared/api/client";

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
