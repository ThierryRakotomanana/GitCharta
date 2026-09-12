import { useMemo } from "react";
import type { LocalizedProfile } from "@/shared/api/types";

export function useProfilesByCountry(
	audience: LocalizedProfile[]
): Map<string, LocalizedProfile[]> {
	return useMemo(() => {
		return audience.reduce((acc, profile) => {
			const regionalProfiles = acc.get(profile.country) ?? [];
			regionalProfiles.push(profile);
			return acc.set(profile.country, regionalProfiles);
		}, new Map<string, LocalizedProfile[]>());
	}, [audience]);
}
