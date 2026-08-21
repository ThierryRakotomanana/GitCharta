import { useCallback, useRef, useState, type RefObject } from "react";
import { toPng } from "html-to-image";

export interface UseMapSnapshotOptions {
	fileName?: string;
	successDurationMs?: number;
}

export interface UseMapSnapshotResult {
	exportRef: RefObject<HTMLDivElement | null>;
	handleExport: () => Promise<void>;
	isExporting: boolean;
	justExported: boolean;
}

export function useMapSnapshot({
	fileName = "audience-atlas.png",
	successDurationMs = 1800
}: UseMapSnapshotOptions = {}): UseMapSnapshotResult {
	const exportRef = useRef<HTMLDivElement>(null);
	const [isExporting, setIsExporting] = useState(false);
	const [justExported, setJustExported] = useState(false);

	const handleExport = useCallback(async () => {
		if (!exportRef.current) return;
		setIsExporting(true);

		try {
			await document.fonts.ready;

			const dataUrl = await toPng(exportRef.current, {
				pixelRatio: 3,
				cacheBust: true,
				filter: (node) => {
					if (node instanceof Element) {
						return !node.classList.contains("exclude-from-export");
					}
					return true;
				},
				style: {
					margin: "0",
					background: "var(--background)"
				}
			});

			const link = document.createElement("a");
			link.download = fileName;
			link.href = dataUrl;
			link.click();

			setJustExported(true);
			setTimeout(() => setJustExported(false), successDurationMs);
		} catch (error) {
			console.error("Export failed:", error);
		} finally {
			setIsExporting(false);
		}
	}, [fileName, successDurationMs]);

	return { exportRef, handleExport, isExporting, justExported };
}
