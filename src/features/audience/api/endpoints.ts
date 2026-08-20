import type { AudienceJob, AudienceType } from "@/features/audience/model/types";
import { apiClient } from "@/shared/api/client";

export function createAudienceJob(
	login: string,
	type: AudienceType,
	signal?: AbortSignal
): Promise<AudienceJob> {
	return apiClient.post<AudienceJob>(
		"/api/audience/jobs",
		{ login, type },
		{ signal, timeoutMs: 20_000 }
	);
}

export function getAudienceJob(
	id: string,
	signal?: AbortSignal
): Promise<AudienceJob> {
	return apiClient.get<AudienceJob>(
		`/api/audience/jobs/${encodeURIComponent(id)}`,
		{
			signal
		}
	);
}

export function cancelAudienceJob(
	id: string,
	signal?: AbortSignal
): Promise<AudienceJob> {
	return apiClient.delete<AudienceJob>(
		`/api/audience/jobs/${encodeURIComponent(id)}`,
		{
			signal
		}
	);
}
