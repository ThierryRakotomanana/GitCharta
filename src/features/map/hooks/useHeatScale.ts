import { useMemo } from "react";
import { scaleLog } from "d3-scale";
import type { LocalizedProfile } from "@/shared/api/types";

export function useHeatScale(
	profilesByCountry: Map<string, LocalizedProfile[]>
): (count: number) => number {
	const maxCount = useMemo(
		() =>
			Math.max(0, ...Array.from(profilesByCountry.values()).map((p) => p.length)),
		[profilesByCountry]
	);

	return useMemo(() => {
		const domainMax = Math.max(1, maxCount);
		const scale = scaleLog()
			.domain([1, domainMax + 1])
			.range([0.22, 0.95])
			.clamp(true);
		return (count: number) => scale(count);
	}, [maxCount]);
}
