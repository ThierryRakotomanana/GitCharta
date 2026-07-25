import { useMemo } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { Geometry } from "geojson";

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
	height: number
): { mapPaths: CountryPath[]; spherePath: string } {
	const projection = useMemo(
		() => geoNaturalEarth1().fitSize([width, height], { type: "Sphere" }),
		[width, height]
	);

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
