import { useMemo } from "react";
import type { LocalizedGithubProfile } from "@/api/graphql.types";

export function useProfilesByCountry(
	audience: LocalizedGithubProfile[]
): Map<string, LocalizedGithubProfile[]> {
	return useMemo(() => {
		return audience.reduce((acc, profile) => {
			const regionalProfiles = acc.get(profile.country) ?? [];
			regionalProfiles.push(profile);
			return acc.set(profile.country, regionalProfiles);
		}, new Map<string, LocalizedGithubProfile[]>());
	}, [audience]);
}
