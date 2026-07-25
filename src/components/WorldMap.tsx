import { useMemo } from "react";
import type { LocalizedGithubProfile } from "@/api/graphql.types";
import { useGeoJson } from "@/hooks/useGeoJson";
import { MAP_BASE_STYLING } from "@/lib/getCountryColor";
import { scaleLog } from "d3-scale";
import { Button } from "@/components/ui/button";
import { Camera, Check } from "lucide-react";
import { useMapStats } from "@/hooks/useMapStats";
import { useMapSnapshot } from "@/hooks/useMapSnapshot";
import { useCountryPaths, type WorldGeoJson } from "@/hooks/useCountryPaths";

export interface WorldMapProps {
	width: number;
	height: number;
	setCountry: (country: string) => void;
	audience: LocalizedGithubProfile[];
	selectedCountry?: string | null;
}

export const WorldMap = ({
	width,
	height,
	setCountry,
	audience,
	selectedCountry = null
}: WorldMapProps) => {
	const url =
		"https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson";

	const {
		data: geoJson,
		isLoading,
		error: loadError,
		retry: setReloadKey
	} = useGeoJson<WorldGeoJson>(url);

	const { mapPaths, spherePath } = useCountryPaths(geoJson, width, height);

	const profilesByCountry = useMemo(() => {
		return audience.reduce((acc, profile) => {
			const regionalProfiles = acc.get(profile.country) ?? [];
			regionalProfiles.push(profile);
			return acc.set(profile.country, regionalProfiles);
		}, new Map<string, LocalizedGithubProfile[]>());
	}, [audience]);

	const maxCount = useMemo(
		() =>
			Math.max(0, ...Array.from(profilesByCountry.values()).map((p) => p.length)),
		[profilesByCountry]
	);
	const heatScale = useMemo(() => {
		const domainMax = Math.max(1, maxCount);
		return scaleLog()
			.domain([1, domainMax + 1])
			.range([0.22, 0.95])
			.clamp(true);
	}, [maxCount]);

	const stats = useMapStats(audience, profilesByCountry);
	const { svgRef, handleExport, isExporting, justExported } = useMapSnapshot({
		width,
		height,
		stats
	});

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
		<div className='relative' style={{ width, height }}>
			<svg ref={svgRef} width={width} height={height} className='bg-(--map-space)'>
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
					<path d={spherePath} fill='var(--map-water)' />
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
								className={`transition-colors duration-300 ease-in-out cursor-pointer stroke-accent-foreground hover:stroke-[1.5px] hover:brightness-110 focus:outline-none focus-visible:stroke-[2.5px] focus-visible:stroke-ring ${
									isSelected ? "stroke-[2px] stroke-primary" : "stroke-[0.05px]"
								}`}
								tabIndex={0}
								role='button'
								aria-pressed={isSelected}
								aria-label={`${country.name}, ${hasData ? `${count} follower${count > 1 ? "s" : ""}` : "no followers"}`}
								onClick={() => setCountry(country.id)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										setCountry(country.id);
									}
								}}
							/>
						);
					})}
				</g>
			</svg>

			<div className='absolute top-3 right-3 z-10'>
				<Button
					type='button'
					size='icon'
					variant='secondary'
					onClick={handleExport}
					disabled={isExporting}
					title='Save snapshot'
					aria-label='Save a snapshot of this map with audience stats'
					className='h-10 w-10 sm:h-9 sm:w-9 bg-card border border-border shadow-sm'>
					{justExported ?
						<Check className='h-4 w-4 text-primary' />
					:	<Camera className={`h-4 w-4 ${isExporting ? "animate-pulse" : ""}`} />}
				</Button>
			</div>
		</div>
	);
};
