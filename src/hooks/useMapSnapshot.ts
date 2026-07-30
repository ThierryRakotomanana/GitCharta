import { useCallback, useRef, useState, type RefObject } from "react";
import { exportSvgSnapshot } from "@/lib/exportSvgSnapshot";
import type { MapStats } from "@/hooks/useMapStats";

export interface UseMapSnapshotOptions {
	width: number;
	height: number;
	stats: MapStats;
	fileName?: string;
	successDurationMs?: number;
}

export interface UseMapSnapshotResult {
	svgRef: RefObject<SVGSVGElement | null>;
	handleExport: () => Promise<void>;
	isExporting: boolean;
	justExported: boolean;
}

export function useMapSnapshot({
	width,
	height,
	stats,
	fileName = "audience-atlas.png",
	successDurationMs = 1800
}: UseMapSnapshotOptions): UseMapSnapshotResult {
	const svgRef = useRef<SVGSVGElement>(null);
	const [isExporting, setIsExporting] = useState(false);
	const [justExported, setJustExported] = useState(false);

	const handleExport = useCallback(async () => {
		if (!svgRef.current) return;
		setIsExporting(true);
		try {
			await exportSvgSnapshot({
				svg: svgRef.current,
				width,
				height,
				stats,
				fileName
			});
			setJustExported(true);
			setTimeout(() => setJustExported(false), successDurationMs);
		} catch {
			setIsExporting(false);
			return;
		}
		setIsExporting(false);
	}, [width, height, stats, fileName, successDurationMs]);

	return { svgRef, handleExport, isExporting, justExported };
}
