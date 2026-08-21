import type { AudienceJob, AudienceType } from "../model/types";
import { createAudienceJob, getAudienceJob, cancelAudienceJob } from "./endpoints";

export interface AudienceService {
	createJob(
		login: string,
		type: AudienceType,
		signal?: AbortSignal
	): Promise<AudienceJob>;
	getJob(id: string, signal?: AbortSignal): Promise<AudienceJob>;
	cancelJob(id: string, signal?: AbortSignal): Promise<AudienceJob>;
}

export const githubAudienceService: AudienceService = {
	createJob: createAudienceJob,
	getJob: getAudienceJob,
	cancelJob: cancelAudienceJob
};
