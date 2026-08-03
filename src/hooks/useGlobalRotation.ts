import { useCallback, useEffect, useRef, useState } from "react";
import { geoCentroid } from "d3-geo";
import type { CountryFeature, WorldGeoJson } from "@/hooks/useCountryPaths";

export function useGlobeRotation(
	selectedCountry: string | null | undefined,
	geoJson: WorldGeoJson | null
) {
	const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
	const currentRotationRef = useRef(rotation);
	const [isDragging, setIsDragging] = useState(false);

	const dragStartRef = useRef<{
		x: number;
		y: number;
		rotation: [number, number, number];
	} | null>(null);
	const animationRef = useRef<number | null>(null);

	useEffect(() => {
		currentRotationRef.current = rotation;
	}, [rotation]);

	const onPointerDown = useCallback((e: React.PointerEvent) => {
		if (animationRef.current) cancelAnimationFrame(animationRef.current);
		e.currentTarget.setPointerCapture(e.pointerId);
		setIsDragging(true);
		dragStartRef.current = {
			x: e.clientX,
			y: e.clientY,
			rotation: currentRotationRef.current
		};
	}, []);

	const onPointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!isDragging || !dragStartRef.current) return;

			const dx = e.clientX - dragStartRef.current.x;
			const dy = e.clientY - dragStartRef.current.y;

			const sensitivity = 0.5;
			const newRotation: [number, number, number] = [
				dragStartRef.current.rotation[0] + dx * sensitivity,
				dragStartRef.current.rotation[1] - dy * sensitivity,
				0
			];

			newRotation[1] = Math.max(-90, Math.min(90, newRotation[1]));
			setRotation(newRotation);
		},
		[isDragging]
	);

	const onPointerUp = useCallback((e: React.PointerEvent) => {
		if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
			e.currentTarget.releasePointerCapture(e.pointerId);
		}
		setIsDragging(false);
		dragStartRef.current = null;
	}, []);

	useEffect(() => {
		if (!selectedCountry || !geoJson) return;

		const feature = geoJson.features.find(
			(f: CountryFeature) => f.properties.ISO_A2_EH === selectedCountry
		);
		if (!feature) return;

		const centroid = geoCentroid(feature);
		const targetRotation: [number, number, number] = [
			-centroid[0],
			-centroid[1],
			0
		];
		const startRotation = currentRotationRef.current;

		let dLambda = targetRotation[0] - startRotation[0];
		dLambda = dLambda % 360;
		if (dLambda < -180) dLambda += 360;
		if (dLambda > 180) dLambda -= 360;

		const startTime = performance.now();
		const duration = 750;

		const animate = (time: number) => {
			const elapsed = time - startTime;
			const progress = Math.min(elapsed / duration, 1);
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

		if (animationRef.current) cancelAnimationFrame(animationRef.current);
		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) cancelAnimationFrame(animationRef.current);
		};
	}, [selectedCountry, geoJson]);

	return {
		rotation,
		isDragging,
		dragHandlers: {
			onPointerDown,
			onPointerMove,
			onPointerUp,
			onPointerLeave: onPointerUp,
			onPointerCancel: onPointerUp
		}
	};
}
