import { useRef } from "react";
import type { LocalizedGithubProfile } from "@/api/graphql.types";
import { useGeoJson } from "@/hooks/useGeoJson";
import { MAP_BASE_STYLING } from "@/lib/getCountryColor";
import { Button } from "@/components/ui/button";
import { Camera, Check, X } from "lucide-react";
import { useMapStats } from "@/hooks/useMapStats";
import { useMapSnapshot } from "@/hooks/useMapSnapshot";
import { useCountryPaths, type WorldGeoJson } from "@/hooks/useCountryPaths";
import { useHeatScale } from "@/hooks/useHeatScale";
import { useProfilesByCountry } from "@/hooks/useProfilesByCountry";
import { getRegionName } from "@/lib/region";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useGlobeRotation } from "@/hooks/useGlobeRotation";
import type { MAP_MODE } from "@/App";

export interface WorldMapProps {
	width: number;
	height: number;
	setCountry: (country: string | null) => void;
	audience: LocalizedGithubProfile[];
	selectedCountry?: string | null;
	username?: string;
	avatarUrl?: string;
	mapTypeLabel?: string;
	mapMode: MAP_MODE;
}

export const WorldMap = ({
	width,
	height,
	setCountry,
	audience,
	selectedCountry = null,
	username = "Developer",
	avatarUrl,
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

	const { rotation, isDragging, dragHandlers } = useGlobeRotation(
		selectedCountry,
		geoJson
	);

	const { mapPaths, sphere2D, sphere3D, progress } = useCountryPaths(
		geoJson,
		width,
		height,
		rotation,
		mapMode
	);

	const stats = useMapStats(audience, profilesByCountry);
	const safeFilename = `${username.toLowerCase()}-${mapTypeLabel.toLowerCase().replace(/\s+/g, "-")}-map.png`;

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

	return (
		<div
			ref={exportRef}
			className='relative overflow-hidden'
			style={{ width, height }}>
			<svg
				ref={svgRef}
				width={width}
				height={height}
				className={`bg-(--map-space) touch-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
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
								style={{ opacity: country.opacity }}
								className={`transition-[fill,stroke,opacity] duration-300 ease-in-out cursor-pointer stroke-accent-foreground hover:stroke-[1.5px] hover:brightness-110 focus:outline-none ${
									isSelected ? "stroke-[2px] stroke-primary" : "stroke-[0.05px]"
								}`}
								onClick={() => setCountry(isSelected ? null : country.id)}
							/>
						);
					})}
				</g>
			</svg>

			<div className='absolute bottom-3 left-3 sm:bottom-6 sm:left-6 z-10 pointer-events-none'>
				<Card className='flex flex-col gap-2 p-3.5 bg-card/85 backdrop-blur-md border-border/50 shadow-lg min-w-55 pointer-events-auto transition-all duration-200'>
					{selectedCountryStats ?
						<div>
							<div className='flex items-center justify-between gap-2 mb-1'>
								<span className='text-[10px] font-bold uppercase tracking-wider text-primary'>
									Region Overview
								</span>
								<button
									onClick={() => setCountry(null)}
									className='text-muted-foreground hover:text-foreground rounded-sm p-0.5'>
									<X className='h-3.5 w-3.5' />
								</button>
							</div>
							<div className='text-sm font-bold text-foreground'>
								{selectedCountryStats.name}
							</div>
							<div className='mt-1 flex items-baseline gap-1.5'>
								<span className='text-xl font-extrabold text-foreground'>
									{selectedCountryStats.count}
								</span>
								<span className='text-xs text-muted-foreground'>
									person{selectedCountryStats.count !== 1 ? "s" : ""} (
									{selectedCountryStats.pctOfTotal}%)
								</span>
							</div>
							{selectedCountryStats.topProfiles.length > 0 && (
								<div className='mt-2.5 pt-2 border-t border-border/40 flex items-center gap-1.5'>
									<span className='text-[10px] text-muted-foreground'>
										Network:
									</span>
									<div className='flex -space-x-1.5 overflow-hidden'>
										{selectedCountryStats.topProfiles.map((profile) => (
											<Avatar
												key={profile.id}
												className='inline-block h-5 w-5 rounded-full ring-1 ring-background'>
												<AvatarImage
													src={profile.avatarUrl}
													crossOrigin='anonymous'
												/>
												<AvatarFallback className='text-[8px]'>
													{profile.login.slice(0, 2).toUpperCase()}
												</AvatarFallback>
											</Avatar>
										))}
									</div>
								</div>
							)}
						</div>
					:	<div>
							<div className='text-[10px] font-bold uppercase tracking-wider text-primary mb-1'>
								Global Footprint
							</div>
							<div>
								<div className='text-sm font-semibold text-foreground'>
									Top: {stats.topCountryName}
								</div>
								<div className='text-xs text-muted-foreground'>
									{stats.topCountryPct}% of total audience
								</div>
							</div>
							<div className='h-px bg-border/50 w-full my-2' />
							<div className='text-xs font-medium text-foreground'>
								{stats.coveragePct}% mapped location
							</div>
						</div>
					}
				</Card>
			</div>
			<div className='absolute top-3 left-3 sm:top-auto sm:left-auto sm:bottom-6 sm:right-6 z-10 flex items-center gap-3  pointer-events-none p-3.5 bg-card/85 backdrop-blur-md border-border/50  rounded-md'>
				<Avatar className='h-10 w-10 border-2 border-primary/20 shadow-sm bg-card'>
					<AvatarImage src={avatarUrl} crossOrigin='anonymous' />
					<AvatarFallback>{username.substring(0, 2).toUpperCase()}</AvatarFallback>
				</Avatar>
				<div className='flex flex-col px-2 py-0.5 rounded-md'>
					<h2 className='text-[10px] font-bold uppercase tracking-wider text-primary'>
						{username}'s {mapTypeLabel}
					</h2>
					<p className='text-xs font-medium text-muted-foreground'>
						Global Footprint
					</p>
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
					className='h-10 w-10 sm:h-9 sm:w-9 bg-card border border-border shadow-sm'>
					{justExported ?
						<Check className='h-4 w-4 text-primary' />
					:	<Camera className={`h-4 w-4 ${isExporting ? "animate-pulse" : ""}`} />}
				</Button>
			</div>
		</div>
	);
};
