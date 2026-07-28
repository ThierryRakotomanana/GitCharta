export interface MapStatsCardData {
	coveragePct: number;
	unlocatedPct: number;
	topCountryName: string;
	topCountryPct: number;
}

export interface MapStatsCardTheme {
	cardBg: string;
	border: string;
	foreground: string;
	muted: string;
}

export function drawMapStatsCard(
	ctx: CanvasRenderingContext2D,
	viewportHeight: number,
	stats: MapStatsCardData,
	theme: MapStatsCardTheme
): void {
	const pad = 14;
	const cardW = 200;
	const cardH = 92;
	const x = pad;
	const y = viewportHeight - cardH - pad;
	const radius = 10;

	ctx.save();
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.arcTo(x + cardW, y, x + cardW, y + cardH, radius);
	ctx.arcTo(x + cardW, y + cardH, x, y + cardH, radius);
	ctx.arcTo(x, y + cardH, x, y, radius);
	ctx.arcTo(x, y, x + cardW, y, radius);
	ctx.closePath();
	ctx.fillStyle = theme.cardBg;
	ctx.fill();
	ctx.strokeStyle = theme.border;
	ctx.lineWidth = 1;
	ctx.stroke();

	ctx.fillStyle = theme.foreground;
	ctx.font = "600 12px system-ui, -apple-system, sans-serif";
	ctx.fillText(
		`Top: ${stats.topCountryName} (${stats.topCountryPct}%)`,
		x + 14,
		y + 26
	);

	ctx.fillStyle = theme.muted;
	ctx.font = "500 11px system-ui, -apple-system, sans-serif";
	ctx.fillText(`${stats.coveragePct}% of audience located`, x + 14, y + 50);
	ctx.fillText(`${stats.unlocatedPct}% without a public location`, x + 14, y + 70);
	ctx.restore();
}
