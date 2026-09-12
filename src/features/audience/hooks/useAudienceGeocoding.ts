import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UNKNOWN_REGION } from "@/shared/lib/region";
import type { AudienceJob } from "../model/types";
import type { LocalizedProfile, ProfileNode } from "@/shared/api/types";
import { geocode } from "@/shared/lib/geocode";

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
	const [progress, setProgress] = useState<{ done: number; total: number }>({
		done: 0,
		total: 0
	});

	const enabled = !!followersResult && !!followingResult;

	const query = useQuery({
		queryKey: ["audience-geocode", String(resetKey)],
		queryFn: async ({ signal }): Promise<AudienceData> => {
			const followers = followersResult?.nodes ?? [];
			const following = followingResult?.nodes ?? [];

			const uniqueProfiles = new Map<string, ProfileNode>();
			for (const p of [...followers, ...following]) uniqueProfiles.set(p.login, p);

			setProgress({ done: 0, total: uniqueProfiles.size });

			const result = await geocode(
				[...uniqueProfiles.values()],
				({ done, total }) => setProgress({ done, total }),
				signal
			);

			if (!result) throw new Error("Geocoding returned no result");

			const { profileCountryMap } = result;
			const attachCountry = (profiles: ProfileNode[]): LocalizedProfile[] =>
				profiles.map((p) => ({
					...p,
					country: profileCountryMap.get(p.login) ?? UNKNOWN_REGION
				}));

			const followerProfiles = attachCountry(followers);
			const followingProfiles = attachCountry(following);
			const followerLogins = new Set(followerProfiles.map((f) => f.login));
			const ghosts = followingProfiles.filter((f) => !followerLogins.has(f.login));

			setProgress({ done: uniqueProfiles.size, total: uniqueProfiles.size });

			return { followers: followerProfiles, following: followingProfiles, ghosts };
		},
		enabled,
		staleTime: Infinity,
		retry: false
	});

	const status: GeocodeStatus =
		!enabled ? "idle"
		: query.isError ? "error"
		: query.isSuccess ? "done"
		: "running";

	return {
		audience: query.data ?? null,
		status,
		progress
	};
}
