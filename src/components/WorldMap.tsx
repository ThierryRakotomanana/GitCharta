import { useMemo, useRef, useState } from "react";
import type {
	GithubUserProfile,
	LocalizedGithubProfile
} from "@/api/graphql.types";
import { useGeoJson } from "@/hooks/useGeoJson";
import { MAP_BASE_STYLING } from "@/lib/getCountryColor";
import { Button } from "@/components/ui/button";
import { Camera, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useMapStats } from "@/hooks/useMapStats";
import { useMapSnapshot } from "@/hooks/useMapSnapshot";
import { useCountryPaths, type WorldGeoJson } from "@/hooks/useCountryPaths";
import { useHeatScale } from "@/hooks/useHeatScale";
import { useProfilesByCountry } from "@/hooks/useProfilesByCountry";
import { getRegionName } from "@/lib/region";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGlobeRotation } from "@/hooks/useGlobeRotation";
import type { MAP_MODE } from "@/App";
import { useMapZoom } from "@/hooks/useMapZoom";
import { ZoomControls } from "@/components/ZoomControls";
import { CountryFlag } from "@/components/CountryFlag";

export interface WorldMapProps {
	width: number;
	height: number;
	setCountry: (country: string | null) => void;
	audience: LocalizedGithubProfile[];
	selectedCountry?: string | null;
	user: GithubUserProfile | null;
	mapTypeLabel?: string;
	mapMode: MAP_MODE;
}

export const WorldMap = ({
	width,
	height,
	setCountry,
	audience,
	selectedCountry = null,
	user,
	mapTypeLabel = "Network",
	mapMode
}: WorldMapProps) => {
	const url =
		"https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson";

	const {
		data: geoJson,
		isLoading,
		error: loadError,
		retry: setReloadKey
	} = useGeoJson<WorldGeoJson>(url);

	const profilesByCountry = useProfilesByCountry(audience);
	const heatScale = useHeatScale(profilesByCountry);
	const svgRef = useRef<SVGSVGElement>(null);

	const {
		zoom,
		zoomIn,
		zoomOut,
		resetZoom,
		canZoomIn,
		canZoomOut,
		isZoomed,
		handleWheel
	} = useMapZoom(1);

	const { rotation, pan, isDragging, didDrag, dragHandlers } = useGlobeRotation(
		selectedCountry,
		geoJson,
		zoom,
		mapMode,
		width,
		height
	);

	const { mapPaths, sphere2D, sphere3D, progress } = useCountryPaths(
		geoJson,
		width,
		height,
		rotation,
		pan,
		mapMode,
		zoom
	);

	const stats = useMapStats(audience, profilesByCountry);
	const [isCollapsed, setIsCollapsed] = useState(true);
	const safeFilename = `${user?.login.toLowerCase()}-${mapTypeLabel.toLowerCase().replace(/\s+/g, "-")}-map.png`;

	const { exportRef, handleExport, isExporting, justExported } = useMapSnapshot({
		fileName: safeFilename
	});

	const selectedCountryStats = useMemo(() => {
		if (!selectedCountry) return null;

		const profiles = profilesByCountry.get(selectedCountry) ?? [];
		const count = profiles.length;
		const totalAudience = audience.length;
		const pctOfTotal =
			totalAudience > 0 ? Math.round((count / totalAudience) * 100) : 0;

		return {
			id: selectedCountry,
			name: getRegionName(selectedCountry),
			count,
			pctOfTotal,
			topProfiles: profiles.slice(0, 3)
		};
	}, [selectedCountry, profilesByCountry, audience.length]);

	if (loadError) {
		return (
			<div
				style={{ width, height }}
				className='flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground'>
				<p>Couldn't load the world map.</p>
				<button
					type='button'
					onClick={setReloadKey}
					className='rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'>
					Retry
				</button>
			</div>
		);
	}

	if (isLoading || !geoJson) {
		return (
			<div
				style={{ width, height }}
				className='flex items-center justify-center text-sm text-muted-foreground'>
				<p className='animate-pulse'>Loading global coordinates…</p>
			</div>
		);
	}

	const isInteractive = mapMode === "GLOBE" || isZoomed;
	const cursorState =
		!isInteractive ? "cursor-default"
		: isDragging ? "cursor-grabbing"
		: "cursor-grab";

	const totalNetwork = audience.length;

	return (
		<div
			ref={exportRef}
			className='relative overflow-hidden select-none'
			style={{ width, height }}>
			<svg
				ref={svgRef}
				width={width}
				height={height}
				onWheel={handleWheel}
				className={`bg-(--map-space) touch-none ${cursorState}`}
				{...dragHandlers}>
				<defs>
					<filter id='map-glow' x='-60%' y='-60%' width='220%' height='220%'>
						<feGaussianBlur stdDeviation='6' result='blur' />
						<feFlood
							floodColor='var(--primary)'
							floodOpacity='0.55'
							result='color'
						/>
						<feComposite in='color' in2='blur' operator='in' result='coloredGlow' />
						<feComposite
							in='coloredGlow'
							in2='SourceAlpha'
							operator='out'
							result='hollowGlow'
						/>
						<feMerge>
							<feMergeNode in='hollowGlow' />
							<feMergeNode in='SourceGraphic' />
						</feMerge>
					</filter>
				</defs>

				<g>
					<path
						d={sphere2D}
						fill='var(--map-water)'
						opacity={1 - progress}
						style={{
							transform: `scale(${1 - progress * 0.15})`,
							transformOrigin: "center center",
							transformBox: "fill-box"
						}}
					/>

					<path
						d={sphere3D}
						fill='var(--map-water)'
						opacity={progress}
						style={{
							transform: `scale(${0.85 + progress * 0.15})`,
							transformOrigin: "center center",
							transformBox: "fill-box"
						}}
					/>
				</g>
				<g>
					{mapPaths.map((country) => {
						const count = profilesByCountry.get(country.id)?.length ?? 0;
						const hasData = count > 0;
						const isSelected =
							selectedCountry !== null && country.id === selectedCountry;

						if (!country.svgPath) return null;

						return (
							<path
								key={`${country.id}-${country.name}`}
								d={country.svgPath}
								filter={isSelected ? "url(#map-glow)" : undefined}
								fill={
									hasData ?
										`hsl(var(--signal) / ${heatScale(count).toFixed(2)})`
									:	MAP_BASE_STYLING.defaultFill
								}
								style={{
									opacity: country.opacity,
									pointerEvents: country.opacity < 0.1 ? "none" : "auto"
								}}
								className={`transition-[fill,stroke] duration-200 ease-in-out cursor-pointer stroke-accent-foreground hover:stroke-[1.5px] hover:brightness-110 focus:outline-none ${
									isSelected ?
										"stroke-[1.5px] stroke-primary fill-primary/80 z-10"
									:	"stroke-[0.1px] stroke-muted hover:stroke-[1px] hover:stroke-primary hover:brightness-125"
								}`}
								onClick={(e) => {
									if (didDrag()) {
										e.stopPropagation();
										return;
									}
									setCountry(isSelected ? null : country.id);
								}}
							/>
						);
					})}
				</g>
			</svg>

			<div className='absolute bottom-20 right-4 sm:right-6 z-20 exclude-from-export'>
				<ZoomControls
					zoomIn={zoomIn}
					zoomOut={zoomOut}
					resetZoom={resetZoom}
					canZoomIn={canZoomIn}
					canZoomOut={canZoomOut}
					isZoomed={isZoomed}
					zoom={zoom}
				/>
			</div>

			<div className='absolute bottom-4 left-4 sm:left-6 sm:translate-x-0 sm:bottom-6 z-20 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-auto w-[90%] max-w-[320px] sm:w-80'>
				<div className='flex flex-col bg-card/95 backdrop-blur-xl ring-1 ring-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full rounded-2xl overflow-hidden transition-all duration-300'>
					<button
						onClick={() => setIsCollapsed(!isCollapsed)}
						className='w-full flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3.5 bg-transparent cursor-pointer hover:bg-muted/30 transition-colors group text-left outline-none'>
						<div className='flex items-center gap-2.5 overflow-hidden'>
							{selectedCountryStats ?
								<CountryFlag
									isoCode={selectedCountryStats?.id}
									className='h-5 w-7 shrink-0 rounded-sm border border-border/40'
								/>
							:	<div className={`h-2 w-2 rounded-full shrink-0 "bg-primary`} />}

							<h3 className='text-xs sm:text-sm font-medium text-foreground truncate'>
								{selectedCountryStats ?
									selectedCountryStats.name
								:	"Global Overview"}
							</h3>
						</div>
						<div className='flex items-center gap-3 shrink-0'>
							<span className='text-base sm:text-lg font-semibold tabular-nums tracking-tight text-foreground'>
								{selectedCountryStats ? selectedCountryStats.count : totalNetwork}
							</span>
							<div className='text-muted-foreground group-hover:text-foreground transition-colors'>
								{isCollapsed ?
									<ChevronUp className='h-4 w-4' />
								:	<ChevronDown className='h-4 w-4' />}
							</div>
						</div>
					</button>

					<div
						className={`grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
							isCollapsed ?
								"grid-rows-[0fr] opacity-0"
							:	"grid-rows-[1fr] opacity-100"
						}`}>
						<div className='overflow-hidden'>
							<div className='px-3.5 pb-3.5 pt-1 sm:px-4 sm:pb-4 sm:pt-1 flex flex-col gap-3 sm:gap-4 text-xs sm:text-sm'>
								<div className='h-px w-full bg-border/40' />

								{selectedCountryStats ?
									<div className='flex flex-col gap-3'>
										<div className='flex items-end justify-between'>
											<div className='flex flex-col gap-0.5 sm:gap-1'>
												<span className='text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-medium'>
													Share of {mapTypeLabel}
												</span>
												<span className='text-xs sm:text-sm text-foreground tabular-nums'>
													{selectedCountryStats.pctOfTotal}% of network
												</span>
											</div>

											{selectedCountryStats.topProfiles.length > 0 && (
												<div className='flex -space-x-1.5 sm:-space-x-2'>
													{selectedCountryStats.topProfiles
														.slice(0, 3)
														.map((profile) => (
															<Avatar
																key={profile.id}
																className='inline-block h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-card'>
																<AvatarImage
																	src={profile.avatarUrl}
																	crossOrigin='anonymous'
																/>
																<AvatarFallback className='text-[9px] sm:text-[10px] bg-muted text-muted-foreground'>
																	{profile.login.slice(0, 2).toUpperCase()}
																</AvatarFallback>
															</Avatar>
														))}
												</div>
											)}
										</div>

										<div className='flex items-center justify-between pt-1.5 sm:pt-2 mt-0.5 border-t border-border/30'>
											<span className='text-[9px] sm:text-[10px] text-muted-foreground/75 truncate pr-2'>
												Origin: {user?.login}
											</span>
											<button
												onClick={(e) => {
													e.stopPropagation();
													setCountry(null);
												}}
												className='text-[10px] sm:text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors px-1.5 py-0.5 -mr-1 rounded-md hover:bg-destructive/10 shrink-0'>
												Clear Selection
											</button>
										</div>
									</div>
								:	<div className='flex flex-col gap-3'>
										<div className='flex items-end justify-between'>
											<div className='flex flex-col gap-0.5 sm:gap-1'>
												<span className='text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-medium'>
													Highest Density
												</span>
												<span className='text-xs sm:text-sm text-foreground font-medium truncate max-w-35'>
													{stats.topCountryName}
												</span>
											</div>
											<div className='flex flex-col gap-0.5 sm:gap-1 text-right'>
												<span className='text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-medium'>
													Concentration
												</span>
												<span className='text-xs sm:text-sm text-foreground tabular-nums'>
													{stats.topCountryPct}% of total
												</span>
											</div>
										</div>

										<div className='flex flex-col gap-1.5 pt-1 sm:pt-2'>
											<div className='flex items-center justify-between text-[9px] sm:text-[10px] uppercase tracking-widest font-medium'>
												<span className='text-primary'>
													Located: {stats.coveragePct}%
												</span>
												<span className='text-muted-foreground'>
													Unknown: {stats.unlocatedPct}%
												</span>
											</div>
											<div className='h-1.5 w-full bg-muted rounded-full overflow-hidden flex'>
												<div
													className='h-full bg-primary transition-all duration-1000 ease-out'
													style={{ width: `${stats.coveragePct}%` }}
												/>
											</div>
										</div>

										<div className='flex items-center justify-between pt-1.5 sm:pt-2 mt-0.5 border-t border-border/30'>
											<span className='text-[9px] sm:text-[10px] text-muted-foreground/75 truncate'>
												Mapping {mapTypeLabel} for {user?.login}
											</span>
											<span className='text-[9px] sm:text-[10px] font-mono text-muted-foreground/50'>
												n={totalNetwork}
											</span>
										</div>
									</div>
								}
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='absolute top-4 sm:top-6 right-4 sm:right-6 z-20 exclude-from-export'>
				<Button
					type='button'
					size='icon'
					variant='secondary'
					onClick={handleExport}
					disabled={isExporting}
					title='Save snapshot'
					className='h-10 w-10 sm:h-9 sm:w-9 bg-card border border-border shadow-sm cursor-pointer'>
					{justExported ?
						<Check className='h-4 w-4 text-primary' />
					:	<Camera className={`h-4 w-4 ${isExporting ? "animate-pulse" : ""}`} />}
				</Button>
			</div>
		</div>
	);
};
