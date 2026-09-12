import { useEffect, useMemo, useRef, useState } from "react";
import { useGeoJson } from "@/features/map/hooks/useGeoJson";
import { MAP_BASE_STYLING } from "@/shared/lib/getCountryColor";
import { Camera, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useMapStats } from "@/features/map/hooks/useMapStats";
import { useMapSnapshot } from "@/features/map/hooks/useMapSnapshot";
import {
	useCountryPaths,
	type WorldGeoJson
} from "@/features/map/hooks/useCountryPaths";
import { useHeatScale } from "@/features/map/hooks/useHeatScale";
import { useProfilesByCountry } from "@/features/map/hooks/useProfilesByCountry";
import { getRegionName } from "@/shared/lib/region";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { useGlobeRotation } from "@/features/map/hooks/useGlobeRotation";
import { useMapZoom } from "@/features/map/hooks/useMapZoom";
import { ZoomControls } from "@/features/map/components/ZoomControls";
import { CountryFlag } from "@/shared/components/CountryFlag";
import { Badge } from "@/shared/components/ui/badge";
import type { UserProfileResponse } from "@/features/user-profile";
import type { LocalizedProfile } from "@/shared/api/types";
import { useEntranceReveal } from "@/features/map/hooks/useEntranceReveal";

export type MAP_MODE = "GLOBE" | "SPHERE";

export interface WorldMapProps {
	width: number;
	height: number;
	setCountry: (country: string | null) => void;
	audience: LocalizedProfile[];
	selectedCountry?: string | null;
	user: UserProfileResponse | null;
	isMobile: boolean;
	mapTypeLabel?: string;
}

export const WorldMap = ({
	width,
	height,
	setCountry,
	audience,
	selectedCountry = null,
	user,
	isMobile,
	mapTypeLabel = "Network"
}: WorldMapProps) => {
	const [mapMode, setMapMode] = useState<MAP_MODE>(isMobile ? "GLOBE" : "SPHERE");
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

	const nudgePanRef = useRef<
		| ((
				anchorX: number,
				anchorY: number,
				scaleRatio: number,
				atZoom: number
		  ) => void)
		| null
	>(null);

	const {
		zoom,
		zoomIn,
		zoomOut,
		resetZoom,
		canZoomIn,
		canZoomOut,
		isZoomed,
		handleWheel
	} = useMapZoom(1, (prevZoom, nextZoom, [ax, ay]) => {
		const scaleRatio = nextZoom / prevZoom;
		nudgePanRef.current?.(ax - width / 2, ay - height / 2, scaleRatio, nextZoom);
	});

	const { rotation, pan, isDragging, didDrag, dragHandlers, nudgePan } =
		useGlobeRotation(selectedCountry, geoJson, zoom, mapMode, width, height);

	useEffect(() => {
		nudgePanRef.current = nudgePan;
	}, [nudgePan]);

	const { mapPaths, sphere2D, sphere3D, progress } = useCountryPaths(
		geoJson,
		width,
		height,
		rotation,
		pan,
		mapMode,
		zoom
	);

	const sortedMapPaths = useMemo(() => {
		return [...mapPaths].sort((a, b) => {
			if (a.id === selectedCountry) return 1;
			if (b.id === selectedCountry) return -1;
			return 0;
		});
	}, [mapPaths, selectedCountry]);

	const revealKey = geoJson && user ? `${user.login}-${mapTypeLabel}` : null;
	const countryIds = useMemo(() => mapPaths.map((c) => c.id), [mapPaths]);
	const revealFor = useEntranceReveal(countryIds, profilesByCountry, revealKey);

	const stats = useMapStats(audience, profilesByCountry);
	const [isCollapsed, setIsCollapsed] = useState(!selectedCountry);
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
					onClick={() => setReloadKey()}
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
					{sortedMapPaths.map((country) => {
						const count = profilesByCountry.get(country.id)?.length ?? 0;
						const hasData = count > 0;
						const isSelected =
							selectedCountry !== null && country.id === selectedCountry;

						if (!country.svgPath) return null;

						const combinedOpacity = country.opacity * revealFor(country.id);

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
									opacity: combinedOpacity,
									pointerEvents: combinedOpacity < 0.1 ? "none" : "auto"
								}}
								className={
									"transition-[fill,stroke] duration-300 ease-in-out cursor-pointer stroke-accent-foreground hover:stroke-[1.5px] hover:brightness-110 focus:outline-none focus-visible:stroke-[2px] focus-visible:stroke-primary "
									+ (isSelected ? "stroke-[2px] stroke-primary" : "stroke-[0.05px]")
								}
								role='button'
								tabIndex={combinedOpacity < 0.1 ? -1 : 0}
								aria-label={`${getRegionName(country.id)}${hasData ? `, ${count} ${count === 1 ? "profile" : "profiles"}` : ""}`}
								aria-pressed={isSelected}
								onClick={(e) => {
									if (didDrag()) {
										e.stopPropagation();
										return;
									}
									setCountry(isSelected ? null : country.id);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										setCountry(isSelected ? null : country.id);
									}
								}}
							/>
						);
					})}
				</g>
			</svg>
			<div className='absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col bg-card/92 backdrop-blur-md border border-border-edge shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-floating overflow-hidden exclude-from-export'>
				<div className='flex flex-col'>
					<button
						onClick={() => setMapMode("GLOBE")}
						aria-label='Switch to 3D Globe View'
						title='3D View'
						className={`px-3 py-2.5 transition-colors focus:outline-none ${mapMode === "GLOBE" ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-muted-foreground"}`}>
						<span className='text-3xs font-bold uppercase tracking-widest'>3D</span>
					</button>
					<div className='h-px w-full bg-border-hairline' />
					<button
						onClick={() => setMapMode("SPHERE")}
						aria-label='Switch to 2D Map View'
						title='2D View'
						className={`px-3 py-2.5 transition-colors focus:outline-none ${mapMode === "SPHERE" ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-muted-foreground"}`}>
						<span className='text-3xs font-bold uppercase tracking-widest'>2D</span>
					</button>
				</div>

				<div className='h-px w-full bg-border/60' />
				<ZoomControls
					zoomIn={zoomIn}
					zoomOut={zoomOut}
					resetZoom={resetZoom}
					canZoomIn={canZoomIn}
					canZoomOut={canZoomOut}
					isZoomed={isZoomed}
					zoom={zoom}
				/>

				<div className='h-px w-full bg-border/60' />
				<button
					onClick={handleExport}
					disabled={isExporting}
					aria-label={`Export map snapshot as ${safeFilename}`}
					title={justExported ? `Saved ${safeFilename}` : "Save snapshot"}
					className='px-3 py-2.5 hover:bg-muted/50 transition-colors focus:outline-none group disabled:opacity-50 flex items-center justify-center'>
					{justExported ?
						<Check className='h-4 w-4 text-primary' />
					:	<Camera
							className={`h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors ${isExporting ? "animate-pulse" : ""}`}
						/>
					}
				</button>
			</div>
			<div className='absolute bottom-4 right-3 sm:right-auto sm:left-20 sm:bottom-6 z-20 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-auto w-[calc(100vw-4.5rem)] max-w-[320px] sm:w-80'>
				<div className='flex flex-col bg-card/95 backdrop-blur-xl ring-1 ring-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full rounded-2xl overflow-hidden transition-all duration-300'>
					<button
						onClick={() => setIsCollapsed(!isCollapsed)}
						className='w-full flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3.5 bg-transparent cursor-pointer hover:bg-muted/30 transition-colors group text-left outline-none'>
						<div className='flex items-center gap-2.5 overflow-hidden'>
							{selectedCountryStats ?
								<CountryFlag
									isoCode={selectedCountryStats?.id}
									className={`h-5 w-7 shrink-0 rounded-sm border ${isCollapsed ? "border-primary/50 ring-1 ring-primary/30" : "border-border-hairline"} transition-colors`}
								/>
							:	<div className='h-2 w-2 rounded-full shrink-0 bg-primary shadow-[0_0_6px_var(--primary)]' />
							}

							<div className='flex min-w-0 flex-col'>
								<h3 className='text-xs sm:text-sm font-medium text-foreground truncate'>
									{selectedCountryStats ?
										selectedCountryStats.name
									:	"Global Overview"}
								</h3>
								{isCollapsed && (
									<span className='text-3xs text-subtle-foreground truncate'>
										{selectedCountryStats ?
											`${selectedCountryStats.pctOfTotal}% of ${mapTypeLabel.toLowerCase()}`
										:	`${stats.topCountryName} leads · ${stats.coveragePct}% located`
										}
									</span>
								)}
							</div>
						</div>
						<div className='flex items-center gap-3 shrink-0'>
							<Badge variant='outline'>
								{selectedCountryStats ? selectedCountryStats.count : totalNetwork}
							</Badge>
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
								<div className='h-px w-full bg-border-hairline' />

								{selectedCountryStats ?
									<div className='flex flex-col gap-3'>
										<div className='flex items-end justify-between'>
											<div className='flex flex-col gap-0.5 sm:gap-1'>
												<span className='text-3xs uppercase tracking-widest text-muted-foreground font-medium'>
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
																<AvatarFallback className='text-3xs bg-muted text-muted-foreground'>
																	{profile.login.slice(0, 2).toUpperCase()}
																</AvatarFallback>
															</Avatar>
														))}
												</div>
											)}
										</div>

										<div className='flex items-center justify-between pt-1.5 sm:pt-2 mt-0.5 border-t border-border-hairline'>
											<span className='text-3xs text-subtle-foreground truncate pr-2'>
												Origin: {user?.login}
											</span>
											<button
												onClick={(e) => {
													e.stopPropagation();
													setCountry(null);
												}}
												className='text-2xs font-medium text-muted-foreground hover:text-destructive transition-colors px-1.5 py-0.5 -mr-1 rounded-md hover:bg-destructive/10 shrink-0'>
												Clear Selection
											</button>
										</div>
									</div>
								:	<div className='flex flex-col gap-3'>
										<div className='flex items-end justify-between'>
											<div className='flex flex-col gap-0.5 sm:gap-1'>
												<span className='text-3xs uppercase tracking-widest text-muted-foreground font-medium'>
													Highest Density
												</span>
												<span className='text-xs sm:text-sm text-foreground font-medium truncate max-w-35'>
													{stats.topCountryName}
												</span>
											</div>
											<div className='flex flex-col gap-0.5 sm:gap-1 text-right'>
												<span className='text-3xs uppercase tracking-widest text-muted-foreground font-medium'>
													Concentration
												</span>
												<span className='text-xs sm:text-sm text-foreground tabular-nums'>
													{stats.topCountryPct}% of total
												</span>
											</div>
										</div>

										<div className='flex flex-col gap-1.5 pt-1 sm:pt-2'>
											<div className='flex items-center justify-between text-3xs uppercase tracking-widest font-medium'>
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
		</div>
	);
};
