import { useMemo } from "react";
import { geoNaturalEarth1, geoOrthographic, geoPath } from "d3-geo";
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
): { mapPaths: CountryPath[]; spherePath: string } {
	const projection = useMemo(() => {
		if (mode === "SPHERE") {
			return geoNaturalEarth1().fitSize([width, height], { type: "Sphere" });
		} else {
			return geoOrthographic()
				.fitSize([width, height], { type: "Sphere" })
				.rotate(rotation);
		}
	}, [width, height, rotation, mode]);

	const pathGenerator = useMemo(
		() => geoPath().projection(projection),
		[projection]
	);

	const mapPaths = useMemo(() => {
		if (!geoJson) return [];
		return geoJson.features.map((feature) => ({
			id: feature.properties.ISO_A2_EH,
			name: feature.properties.NAME_EN,
			svgPath: pathGenerator(feature) || ""
		}));
	}, [geoJson, pathGenerator]);

	const spherePath = useMemo(
		() => (pathGenerator({ type: "Sphere" }) as string) || "",
		[pathGenerator]
	);

	return { mapPaths, spherePath };
}
