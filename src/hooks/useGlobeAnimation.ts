import { useCallback, useEffect, useRef } from "react";
import { geoCentroid } from "d3-geo";
import type { CountryFeature, WorldGeoJson } from "@/hooks/useCountryPaths";

const ANIMATION_MS = 750;

export function useGlobeAnimation(
	selectedCountry: string | null | undefined,
	geoJson: WorldGeoJson | null,
	isGlobe: boolean,
	rotation: [number, number, number],
	setRotation: React.Dispatch<React.SetStateAction<[number, number, number]>>
) {
	const animationRef = useRef<number | null>(null);
	const rotationRef = useRef(rotation);

	useEffect(() => {
		rotationRef.current = rotation;
	});

	const cancelAnimation = useCallback(() => {
		if (animationRef.current !== null) {
			cancelAnimationFrame(animationRef.current);
			animationRef.current = null;
		}
	}, []);

	useEffect(() => {
		if (!isGlobe || !selectedCountry || !geoJson) return;

		const feature = geoJson.features.find(
			(f: CountryFeature) => f.properties.ISO_A2_EH === selectedCountry
		);
		if (!feature) return;

		const centroid = geoCentroid(feature);
		if (isNaN(centroid[0]) || isNaN(centroid[1])) return;

		const targetRotation: [number, number, number] = [
			-centroid[0],
			-centroid[1],
			0
		];

		const startRotation = rotationRef.current;

		let dLambda = (targetRotation[0] - startRotation[0]) % 360;
		if (dLambda < -180) dLambda += 360;
		if (dLambda > 180) dLambda -= 360;

		const startTime = performance.now();

		const animate = (time: number) => {
			const progress = Math.min((time - startTime) / ANIMATION_MS, 1);
			const ease = 1 - Math.pow(1 - progress, 3);

			setRotation([
				startRotation[0] + dLambda * ease,
				startRotation[1] + (targetRotation[1] - startRotation[1]) * ease,
				0
			]);

			if (progress < 1) {
				animationRef.current = requestAnimationFrame(animate);
			}
		};

		cancelAnimation();
		animationRef.current = requestAnimationFrame(animate);

		return cancelAnimation;
	}, [selectedCountry, geoJson, isGlobe, setRotation, cancelAnimation]);

	return { cancelAnimation };
}
