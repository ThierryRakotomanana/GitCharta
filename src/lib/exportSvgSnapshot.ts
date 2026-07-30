import { resolveCssVar } from "./resolveCssVar";
import { drawMapStatsCard, type MapStatsCardData } from "./drawMapStatsCard";

export interface ExportSvgSnapshotOptions {
	svg: SVGSVGElement;
	width: number;
	height: number;
	stats: MapStatsCardData;
	fileName?: string;
}

export async function exportSvgSnapshot({
	svg,
	width,
	height,
	stats,
	fileName = "audience-atlas.png"
}: ExportSvgSnapshotOptions): Promise<void> {
	const clone = svg.cloneNode(true) as SVGSVGElement;

	let markup = new XMLSerializer().serializeToString(clone);
	markup = markup.replace(/var\((--[\w-]+)\)/g, (_, name: string) =>
		resolveCssVar(name, "#94a3b8")
	);

	const svgBlob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
	const svgUrl = URL.createObjectURL(svgBlob);

	const image = new Image();
	const loaded = new Promise<void>((resolve, reject) => {
		image.onload = () => resolve();
		image.onerror = () => reject(new Error("Could not render the map image."));
	});
	image.src = svgUrl;
	await loaded;

	const dpr = Math.min(window.devicePixelRatio || 1, 3);
	const canvas = document.createElement("canvas");
	canvas.width = width * dpr;
	canvas.height = height * dpr;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas isn't supported here.");
	ctx.scale(dpr, dpr);

	ctx.fillStyle = resolveCssVar("--background", "#ffffff");
	ctx.fillRect(0, 0, width, height);
	ctx.drawImage(image, 0, 0, width, height);
	URL.revokeObjectURL(svgUrl);

	drawMapStatsCard(ctx, height, stats, {
		cardBg: resolveCssVar("--card", "#ffffff"),
		border: resolveCssVar("--border", "#e2e8f0"),
		foreground: resolveCssVar("--card-foreground", "#0f172a"),
		muted: resolveCssVar("--muted-foreground", "#64748b")
	});

	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, "image/png")
	);
	if (!blob) throw new Error("Could not create the image file.");

	const blobUrl = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = blobUrl;
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(blobUrl);
}
