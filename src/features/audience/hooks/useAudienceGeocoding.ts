import { useEffect, useRef, useState } from "react";
import { UNKNOWN_REGION } from "@/shared/lib/region";
import type { AudienceJob } from "../model/types";
import type { LocalizedProfile, ProfileNode } from "@/shared/api/types";
import { geocode } from "@/shared/lib/geocode";
import { createResourceCache } from "@/shared/lib/createResourceCache";

export type AudienceData = {
	followers: LocalizedProfile[];
	following: LocalizedProfile[];
	ghosts: LocalizedProfile[];
};

export type GeocodeStatus = "idle" | "running" | "done" | "error";

type CachedGeocode = {
	audience: AudienceData;
	progress: { done: number; total: number };
};

export const geocodeCache = createResourceCache<CachedGeocode>();

export function useAudienceGeocoding(
	followersResult: AudienceJob["result"] | undefined,
	followingResult: AudienceJob["result"] | undefined,
	resetKey: unknown
) {
	const key = String(resetKey);

	const [state, setState] = useState(() => {
		const cached = geocodeCache.get(key);
		return {
			resetKey,
			audience: cached?.audience ?? null,
			status: (cached ? "done" : "idle") as GeocodeStatus,
			progress: cached?.progress ?? { done: 0, total: 0 }
		};
	});

	if (state.resetKey !== resetKey) {
		const cached = geocodeCache.get(key);
		setState({
			resetKey,
			audience: cached?.audience ?? null,
			status: cached ? "done" : "idle",
			progress: cached?.progress ?? { done: 0, total: 0 }
		});
	}

	const { audience, status, progress } = state;
	const startedForRef = useRef<unknown>(undefined);

	useEffect(() => {
		if (!followersResult || !followingResult) return;
		if (geocodeCache.get(key)) return;
		if (startedForRef.current === resetKey) return;

		startedForRef.current = resetKey;

		const controller = new AbortController();
		const followers = followersResult?.nodes ?? [];
		const following = followingResult?.nodes ?? [];

		const uniqueProfiles = new Map<string, ProfileNode>();
		for (const p of [...followers, ...following]) uniqueProfiles.set(p.login, p);

		Promise.resolve().then(() => {
			if (!controller.signal.aborted) {
				setState((prev) => ({
					...prev,
					status: "running",
					progress: { done: 0, total: uniqueProfiles.size }
				}));
			}
		});

		geocode(
			[...uniqueProfiles.values()],
			({ done, total }) =>
				setState((prev) => ({ ...prev, progress: { done, total } })),
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

				const geocodedAudience: AudienceData = {
					followers: followerProfiles,
					following: followingProfiles,
					ghosts
				};
				const finalProgress = {
					done: uniqueProfiles.size,
					total: uniqueProfiles.size
				};

				geocodeCache.set(key, {
					audience: geocodedAudience,
					progress: finalProgress
				});

				setState({
					resetKey,
					audience: geocodedAudience,
					progress: finalProgress,
					status: "done"
				});
			})
			.catch(() => {
				if (controller.signal.aborted) return;
				setState((prev) => ({ ...prev, status: "error" }));
			});

		return () => controller.abort();
	}, [followersResult, followingResult, resetKey, key]);

	return { audience, status, progress };
}
