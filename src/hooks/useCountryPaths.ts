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

export interface CountryFeature {
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
	const [progress, setProgress] = useState(mode === "GLOBE" ? 1 : 0);
	const progressRef = useRef(progress);
	const animRef = useRef<number | null>(null);
	const duration = 750;

	useEffect(() => {
		progressRef.current = progress;
	}, [progress]);

	useEffect(() => {
		const target = mode === "GLOBE" ? 1 : 0;
		const startProgress = progressRef.current;
		const startTime = performance.now();
		const frameInterval = 1000 / 30;
		let lastFrameTime = startTime;

		const animate = (now: number) => {
			const elapsed = now - startTime;
			const t = Math.min(1, elapsed / duration);
			const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

			if (now - lastFrameTime >= frameInterval || t >= 1) {
				lastFrameTime = now;
				setProgress(startProgress + (target - startProgress) * ease);
			}

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

	const p3dRaw = useMemo(
		() =>
			geoOrthographic()
				.fitSize([width, height], { type: "Sphere" })
				.rotate(rotation)
				.clipAngle(null),
		[width, height, rotation]
	);

	const pathGenerator = useMemo(() => {
		if (progress === 0) return geoPath().projection(p2d);
		if (progress === 1) return geoPath().projection(p3d);

		const interpolatingProjection = geoTransform({
			point: function (this: { stream: GeoStream }, lon: number, lat: number) {
				const pt2d = p2d([lon, lat]);
				const pt3d = p3dRaw([lon, lat]);

				if (!pt2d || !pt3d) return;

				const x = pt2d[0] + (pt3d[0] - pt2d[0]) * progress;
				const y = pt2d[1] + (pt3d[1] - pt2d[1]) * progress;

				this.stream.point(x, y);
			}
		});

		return geoPath().projection(interpolatingProjection);
	}, [p2d, p3d, p3dRaw, progress, width, height]);

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
