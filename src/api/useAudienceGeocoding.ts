import { useEffect, useRef, useState } from "react";
import { geocode } from "../lib/geocode";
import { UNKNOWN_REGION } from "../lib/region";
import type { AudienceJob, LocalizedProfile, ProfileNode } from "./api.type";

export type AudienceData = {
	followers: LocalizedProfile[];
	following: LocalizedProfile[];
	ghosts: LocalizedProfile[];
};

export type GeocodeStatus = "idle" | "running" | "done" | "error";

export function useAudienceGeocoding(
	followersResult: AudienceJob["result"] | undefined,
	followingResult: AudienceJob["result"] | undefined,
	resetKey: unknown
) {
	const [audience, setAudience] = useState<AudienceData | null>(null);
	const [status, setStatus] = useState<GeocodeStatus>("idle");
	const [progress, setProgress] = useState<{ done: number; total: number }>({
		done: 0,
		total: 0
	});

	const startedForRef = useRef<unknown>(undefined);

	useEffect(() => {
		if (startedForRef.current === resetKey) return;
		startedForRef.current = undefined;
		setAudience(null);
		setStatus("idle");
		setProgress({ done: 0, total: 0 });
	}, [resetKey]);

	useEffect(() => {
		if (!followersResult || !followingResult) return;
		if (startedForRef.current === resetKey) return;
		startedForRef.current = resetKey;

		const controller = new AbortController();
		const followers = followingResult?.nodes ?? [];
		const following = followingResult?.nodes ?? [];

		const uniqueProfiles = new Map<string, ProfileNode>();
		for (const p of [...followers, ...following]) uniqueProfiles.set(p.login, p);

		setStatus("running");
		setProgress({ done: 0, total: uniqueProfiles.size });

		geocode(
			[...uniqueProfiles.values()],
			({ done, total }) => setProgress({ done, total }),
			controller.signal
		)
			.then((result) => {
				if (!result || controller.signal.aborted) return;
				const { profileCountryMap } = result;
				const attachCountry = (profiles: ProfileNode[]): LocalizedProfile[] =>
					profiles.map((p) => ({
						...p,
						country: profileCountryMap.get(p.login) ?? UNKNOWN_REGION
					}));

				const followerProfiles = attachCountry(followers);
				const followingProfiles = attachCountry(following);
				const followerLogins = new Set(followerProfiles.map((f) => f.login));
				const ghosts = followingProfiles.filter(
					(f) => !followerLogins.has(f.login)
				);

				setAudience({
					followers: followerProfiles,
					following: followingProfiles,
					ghosts
				});
				setStatus("done");
			})
			.catch(() => {
				if (controller.signal.aborted) return;
				setStatus("error");
			});

		return () => controller.abort();
	}, [followersResult, followingResult, resetKey]);

	return { audience, status, progress };
}
