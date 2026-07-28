import { useMemo } from "react";
import { getRegionName, UNKNOWN_REGION } from "@/lib/region";
import type { LocalizedGithubProfile } from "@/api/graphql.types";
import type { MapStatsCardData } from "@/lib/drawMapStatsCard";

export type MapStats = MapStatsCardData;

export function useMapStats(
	audience: LocalizedGithubProfile[],
	profilesByCountry: Map<string, LocalizedGithubProfile[]>
): MapStats {
	return useMemo(() => {
		const total = audience.length;
		const unknownCount = profilesByCountry.get(UNKNOWN_REGION)?.length ?? 0;
		const locatedCount = total - unknownCount;

		let topCountry: { code: string; count: number } | null = null;
		for (const [code, profiles] of profilesByCountry) {
			if (code === UNKNOWN_REGION) continue;
			if (!topCountry || profiles.length > topCountry.count) {
				topCountry = { code, count: profiles.length };
			}
		}

		return {
			coveragePct: total > 0 ? Math.round((locatedCount / total) * 100) : 0,
			unlocatedPct: total > 0 ? Math.round((unknownCount / total) * 100) : 0,
			topCountryName: topCountry ? getRegionName(topCountry.code) : "—",
			topCountryPct:
				topCountry && total > 0 ? Math.round((topCountry.count / total) * 100) : 0
		};
	}, [audience, profilesByCountry]);
}
