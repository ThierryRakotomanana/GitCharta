import { useCallback, useMemo } from "react";
import { useAudienceJob } from "./useAudienceJob";
import { useAudienceGeocoding } from "./useAudienceGeocoding";
import type { Credentials } from "@/shared/api/types";
import { useUserProfile } from "@/features/user-profile/hooks/useUserProfile";
import {
	buildSteps,
	overallPercent,
	type Step
} from "@/features/audience/model/audienceProgress";

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

	const geocodeResetKey = `${followersJob.job?.id ?? ""}:${followersJob.job?.status ?? ""}:${followingJob.job?.id ?? ""}:${followingJob.job?.status ?? ""}`;
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

	const followersPhase = followersJob.phase;
	const followingPhase = followingJob.phase;
	const followersCount = followersJob.job?.result?.nodes?.length ?? 0;
	const followingCount = followingJob.job?.result?.nodes?.length ?? 0;
	const followersProgressDone = followersJob.job?.progress.done ?? 0;
	const followingProgressDone = followingJob.job?.progress.done ?? 0;
	const followingStage = followingJob.job?.progress.stage ?? "graphql";
	const recoveredCount = followingJob.job?.result?.recoveredLogins?.length ?? 0;

	const steps: Step[] = useMemo(
		() =>
			buildSteps({
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
			}),
		[
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
		]
	);

	const status: AudienceStatus =
		!login ? "idle"
		: anyFailed ? "error"
		: geocodeStatus === "done" && audience && user ? "success"
		: "loading";

	const connectionIssue =
		followersJob.connectionIssue || followingJob.connectionIssue;
	const error = followersJob.error ?? followingJob.error ?? null;
	const resetAt = followersJob.resetAt ?? followingJob.resetAt ?? null;

	const partialCount = useMemo(() => {
		const followersOk = isDoneOrPartial(followersPhase);
		const followingOk = isDoneOrPartial(followingPhase);
		if (followersOk && !followingOk) return followersCount;
		if (followingOk && !followersOk) return followingCount;
		return null;
	}, [followersPhase, followingPhase, followersCount, followingCount]);

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
