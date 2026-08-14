export type AudienceType = "followers" | "following";

export interface ProfileNode {
	login: string;
	id: string;
	name: string | null;
	avatarUrl: string;
	url: string;
	company: string | null;
	location: string | null;
	twitterUsername: string | null;
	isSiteAdmin: boolean;
}

export type LocalizedProfile = ProfileNode & { country: string };
export type Credentials = { user: string };

export type ReconcileStage = "graphql" | "rest" | "backfill";

export interface JobProgress {
	stage: ReconcileStage;
	done: number;
	total: number | null;
}

export type JobStatus =
	| "pending"
	| "running"
	| "completed"
	| "partial"
	| "failed"
	| "cancelled";

export interface ReconciledAudienceResult {
	nodes: ProfileNode[];
	graphqlTotalCount: number;
	restTotalCount: number;
	recoveredLogins: string[];
	unresolvedLogins: string[];
	partial: boolean;
	resumeAfter: string | null;
}

export interface AudienceJob {
	id: string;
	status: JobStatus;
	login: string;
	type: AudienceType;
	progress: JobProgress;
	result: ReconciledAudienceResult | null;
	error: string;
	createdAt: string;
	updatedAt: string;
}

const TERMINAL_STATUSES: ReadonlySet<JobStatus> = new Set([
	"completed",
	"partial",
	"failed",
	"cancelled"
]);

export function isTerminalStatus(status: JobStatus): boolean {
	return TERMINAL_STATUSES.has(status);
}

export interface UserProfileResponse {
	login: string;
	name: string | null;
	avatarUrl: string;
	url: string;
	followersCount: number;
	followingCount: number;
}

export interface ApiErrorBody {
	error: string;
	resetAt?: string;
}
