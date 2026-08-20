import type { AudienceJob, ReconcileStage } from "./types";
import type { JobPhase } from "../hooks/useAudienceJob";
import type { GeocodeStatus, AudienceData } from "../hooks/useAudienceGeocoding";

export type ProgressStepStatus = "idle" | "active" | "done" | "error";

export type ProgressStep = {
	id: string;
	label: string;
	status: ProgressStepStatus;
	detail: string;
};

export type StepId = "fetch" | "geocode" | "done";
export type Step = ProgressStep & { id: StepId };

const STAGE_LABEL: Record<ReconcileStage, string> = {
	graphql: "",
	rest: " (cross-checking)",
	backfill: " (recovering missed profiles)"
};

const STAGE_FLOOR: Record<ReconcileStage, number> = {
	graphql: 0,
	rest: 0.4,
	backfill: 0.6
};

export function jobFraction(progress: AudienceJob["progress"] | undefined): number {
	if (!progress) return 0;
	if (progress.total == null) return STAGE_FLOOR[progress.stage] ?? 0;
	return Math.min(1, progress.done / Math.max(progress.total, 1));
}

export function overallPercent(
	followersProgress: AudienceJob["progress"] | undefined,
	followingProgress: AudienceJob["progress"] | undefined,
	geocodeDone: number,
	geocodeTotal: number
): number {
	const jobsAvg =
		(jobFraction(followersProgress) + jobFraction(followingProgress)) / 2;
	const jobsPct = jobsAvg * 50;
	const geocodePct = geocodeTotal > 0 ? (geocodeDone / geocodeTotal) * 50 : 0;
	return Math.round(Math.min(100, jobsPct + geocodePct));
}

export function buildSteps(args: {
	bothJobsDone: boolean;
	followersPhase: JobPhase;
	followingPhase: JobPhase;
	anyFailed: boolean;
	followersCount: number;
	followingCount: number;
	followersProgressDone: number;
	followingProgressDone: number;
	followingStage: ReconcileStage;
	recoveredCount: number;
	geocodeStatus: GeocodeStatus;
	geocodeProgress: { done: number; total: number };
	audience: AudienceData | null;
}): Step[] {
	const {
		bothJobsDone,
		followersPhase,
		followingPhase,
		anyFailed,
		followersCount,
		followingCount,
		followersProgressDone,
		followingProgressDone,
		followingStage,
		recoveredCount,
		geocodeStatus,
		geocodeProgress,
		audience
	} = args;

	const jobsRunning =
		!bothJobsDone && (followersPhase !== "idle" || followingPhase !== "idle");

	const fetchDetail =
		bothJobsDone ?
			`${followersCount} followers · ${followingCount} following${recoveredCount ? ` (+${recoveredCount} recovered)` : ""}`
		: jobsRunning ?
			`${followersProgressDone} followers · ${followingProgressDone} following${STAGE_LABEL[followingStage]}…`
		:	"";

	return [
		{
			id: "fetch",
			label: "Fetching followers & following",
			status:
				bothJobsDone ? "done"
				: jobsRunning ? "active"
				: anyFailed ? "error"
				: "idle",
			detail: fetchDetail
		},
		{
			id: "geocode",
			label: "Finding user's country",
			status:
				geocodeStatus === "done" ? "done"
				: geocodeStatus === "running" ? "active"
				: geocodeStatus === "error" ? "error"
				: "idle",
			detail:
				geocodeStatus === "running" ?
					`${geocodeProgress.done} / ${geocodeProgress.total}`
				:	""
		},
		{
			id: "done",
			label: "Building audience",
			status: geocodeStatus === "done" && audience ? "done" : "idle",
			detail: geocodeStatus === "done" && audience ? "All data loaded" : ""
		}
	];
}
