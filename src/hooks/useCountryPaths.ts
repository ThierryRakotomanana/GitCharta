import { useEffect, useMemo, useRef, useState } from "react";
import {
	geoNaturalEarth1,
	geoOrthographic,
	geoPath,
	geoTransform,
	type GeoStream
} from "d3-geo";
import type { Geometry } from "geojson";
import type { MAP_MODE } from "@/App";

interface GeoProperties {
	NAME_EN: string;
	ISO_A2_EH: string;
}

interface CountryFeature {
	type: "Feature";
	properties: GeoProperties;
	geometry: Geometry;
}

export interface WorldGeoJson {
	type: "FeatureCollection";
	features: CountryFeature[];
}

export interface CountryPath {
	id: string;
	name: string;
	svgPath: string;
}

export function useCountryPaths(
	geoJson: WorldGeoJson | null | undefined,
	width: number,
	height: number,
	rotation: [number, number, number],
	mode: MAP_MODE
): {
	mapPaths: CountryPath[];
	sphere2D: string;
	sphere3D: string;
	progress: number;
} {
	const [progress, setProgress] = useState(mode === "GLODE" ? 1 : 0);
	const animRef = useRef<number | null>(null);
	const duration = 750;

	useEffect(() => {
		const target = mode === "GLODE" ? 1 : 0;
		const startTime = performance.now();
		let startProgress: number | null = null;

		const animate = (now: number) => {
			const elapsed = now - startTime;
			const t = Math.min(1, elapsed / duration);
			const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

			setProgress((prev) => {
				if (startProgress === null) {
					startProgress = prev;
				}
				return startProgress + (target - startProgress) * ease;
			});

			if (t < 1) {
				animRef.current = requestAnimationFrame(animate);
			}
		};

		animRef.current = requestAnimationFrame(animate);
		return () => {
			if (animRef.current) cancelAnimationFrame(animRef.current);
		};
	}, [mode, duration]);

	const p2d = useMemo(
		() => geoNaturalEarth1().fitSize([width, height], { type: "Sphere" }),
		[width, height]
	);

	const p3d = useMemo(
		() =>
			geoOrthographic()
				.fitSize([width, height], { type: "Sphere" })
				.rotate(rotation),
		[width, height, rotation]
	);

	const pathGenerator = useMemo(() => {
		if (progress === 0) return geoPath().projection(p2d);
		if (progress === 1) return geoPath().projection(p3d);

		const interpolatingProjection = geoTransform({
			point: function (this: { stream: GeoStream }, lon: number, lat: number) {
				const pt2d = p2d([lon, lat]) ?? [width / 2, height / 2];
				const pt3d = p3d([lon, lat]) ?? [width / 2, height / 2];

				const x = pt2d[0] + (pt3d[0] - pt2d[0]) * progress;
				const y = pt2d[1] + (pt3d[1] - pt2d[1]) * progress;

				this.stream.point(x, y);
			}
		});

		return geoPath().projection(interpolatingProjection);
	}, [p2d, p3d, progress, width, height]);

	const mapPaths = useMemo(() => {
		if (!geoJson) return [];
		return geoJson.features.map((feature) => ({
			id: feature.properties.ISO_A2_EH,
			name: feature.properties.NAME_EN,
			svgPath: pathGenerator(feature) || ""
		}));
	}, [geoJson, pathGenerator]);

	const sphere2D = useMemo(
		() => (geoPath().projection(p2d)({ type: "Sphere" }) as string) || "",
		[p2d]
	);

	const sphere3D = useMemo(
		() => (geoPath().projection(p3d)({ type: "Sphere" }) as string) || "",
		[p3d]
	);

	return { mapPaths, sphere2D, sphere3D, progress };
}
