import { useEffect, useMemo, useState } from "react";

const REVEAL_DURATION = 900;
const MAX_STAGGER = 550;

function easeOutCubic(t: number): number {
	return 1 - Math.pow(1 - t, 3);
}

export interface UseEntranceRevealOptions {
	enabled?: boolean;
}

export function useEntranceReveal(
	countryIds: string[],
	profilesByCountry: Map<string, unknown[]>,
	readyKey: string | number | null,
	options?: UseEntranceRevealOptions
): (countryId: string) => number {
	const enabled = options?.enabled ?? true;

	const order = useMemo(() => {
		const sorted = [...countryIds].sort((a, b) => {
			const countA = profilesByCountry.get(a)?.length ?? 0;
			const countB = profilesByCountry.get(b)?.length ?? 0;
			if (countB !== countA) return countB - countA;
			return a.localeCompare(b);
		});

		const map = new Map<string, number>();
		for (let i = 0; i < sorted.length; i++) {
			map.set(sorted[i], i);
		}
		return map;
	}, [countryIds, profilesByCountry]);

	const rankCount = Math.max(1, countryIds.length - 1);

	const [progress, setProgress] = useState<number>(
		enabled && readyKey !== null ? 0 : 1
	);
	const [prevParams, setPrevParams] = useState({ readyKey, enabled });

	if (readyKey !== prevParams.readyKey || enabled !== prevParams.enabled) {
		setPrevParams({ readyKey, enabled });
		setProgress(enabled && readyKey !== null ? 0 : 1);
	}

	useEffect(() => {
		if (!enabled || readyKey === null) {
			return;
		}

		let animFrameId: number;
		const startTime = performance.now();
		const totalDuration = REVEAL_DURATION + MAX_STAGGER;

		const animate = (now: number) => {
			const elapsed = now - startTime;
			const t = Math.min(1, elapsed / totalDuration);

			setProgress(t);

			if (t < 1) {
				animFrameId = requestAnimationFrame(animate);
			}
		};

		animFrameId = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(animFrameId);
		};
	}, [enabled, readyKey]);

	return useMemo(() => {
		const durationRatio = REVEAL_DURATION / (REVEAL_DURATION + MAX_STAGGER);
		const staggerRatio = MAX_STAGGER / (REVEAL_DURATION + MAX_STAGGER);

		return (countryId: string): number => {
			if (!enabled || progress >= 1) return 1;

			const rank = order.get(countryId) ?? rankCount;
			const delay = (rank / rankCount) * staggerRatio;
			const localT = Math.min(1, Math.max(0, (progress - delay) / durationRatio));

			return easeOutCubic(localT);
		};
	}, [enabled, progress, order, rankCount]);
}
