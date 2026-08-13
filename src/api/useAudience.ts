import { useCallback, useMemo } from "react";
import { useAudienceJob } from "./useAudienceJob";
import { useAudienceGeocoding } from "./useAudienceGeocoding";
import { buildSteps, overallPercent, type Step } from "./audienceProgress";
import { useUserProfile } from "@/api/useUserProfile";

export type Credentials = { user: string };
export type { Step, StepId } from "./audienceProgress";
export type { AudienceData, LocalizedProfile } from "./useAudienceGeocoding";
export type AudienceStatus = "idle" | "loading" | "success" | "error";

const isDoneOrPartial = (phase: string) =>
	phase === "completed" || phase === "partial";

export function useAudience(credentials: Credentials) {
	const { user: login } = credentials;

	const followersJob = useAudienceJob(login, "followers", Boolean(login));
	const followingJob = useAudienceJob(login, "following", Boolean(login));
	const user = useUserProfile(login);

	const bothJobsDone =
		isDoneOrPartial(followersJob.phase) && isDoneOrPartial(followingJob.phase);
	const anyFailed =
		followersJob.phase === "error"
		|| followersJob.phase === "failed"
		|| followingJob.phase === "error"
		|| followingJob.phase === "failed";
	const anyPartial =
		followersJob.phase === "partial" || followingJob.phase === "partial";

	const geocodeResetKey = `${followersJob.job?.id ?? ""}:${followingJob.job?.id ?? ""}`;
	const {
		audience,
		status: geocodeStatus,
		progress: geocodeProgress
	} = useAudienceGeocoding(
		bothJobsDone ? (followersJob.job?.result ?? undefined) : undefined,
		bothJobsDone ? (followingJob.job?.result ?? undefined) : undefined,
		geocodeResetKey
	);

	const pct = useMemo(
		() =>
			overallPercent(
				followersJob.job?.progress,
				followingJob.job?.progress,
				geocodeProgress.done,
				geocodeProgress.total
			),
		[followersJob.job?.progress, followingJob.job?.progress, geocodeProgress]
	);

	const steps: Step[] = useMemo(
		() =>
			buildSteps({
				bothJobsDone,
				followersPhase: followersJob.phase,
				followingPhase: followingJob.phase,
				anyFailed,
				followersCount: followersJob.job?.result?.nodes.length ?? 0,
				followingCount: followingJob.job?.result?.nodes.length ?? 0,
				followersProgressDone: followersJob.job?.progress.done ?? 0,
				followingProgressDone: followingJob.job?.progress.done ?? 0,
				followingStage: followingJob.job?.progress.stage ?? "graphql",
				recoveredCount: followingJob.job?.result?.recoveredLogins.length ?? 0,
				geocodeStatus,
				geocodeProgress,
				audience
			}),
		[
			bothJobsDone,
			followersJob,
			followingJob,
			anyFailed,
			geocodeStatus,
			geocodeProgress,
			audience
		]
	);

	const status: AudienceStatus =
		!login ? "idle"
		: anyFailed ? "error"
		: geocodeStatus === "done" && audience ? "success"
		: "loading";

	const connectionIssue =
		followersJob.connectionIssue || followingJob.connectionIssue;
	const error = followersJob.error ?? followingJob.error ?? null;
	const resetAt = followersJob.resetAt ?? followingJob.resetAt ?? null;

	const partialCount = useMemo(() => {
		const followersOk = isDoneOrPartial(followersJob.phase);
		const followingOk = isDoneOrPartial(followingJob.phase);
		if (followersOk && !followingOk)
			return followersJob.job?.result?.nodes.length ?? null;
		if (followingOk && !followersOk)
			return followingJob.job?.result?.nodes.length ?? null;
		return null;
	}, [followersJob, followingJob]);

	const cancel = useCallback(() => {
		void followersJob.cancel();
		void followingJob.cancel();
	}, [followersJob, followingJob]);

	const retry = useCallback(() => {
		followersJob.restart();
		followingJob.restart();
	}, [followersJob, followingJob]);

	return {
		status,
		steps,
		pct,
		user,
		audience,
		connectionIssue,
		partial: anyPartial,
		error,
		resetAt,
		partialCount,
		cancel,
		retry
	};
}
