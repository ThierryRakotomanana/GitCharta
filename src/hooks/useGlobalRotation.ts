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

	const onPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
		if (animationRef.current) cancelAnimationFrame(animationRef.current);
		setIsDragging(true);
		const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
		const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
		dragStartRef.current = {
			x: clientX,
			y: clientY,
			rotation: currentRotationRef.current
		};
	}, []);

	const onPointerMove = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			if (!isDragging || !dragStartRef.current) return;

			const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
			const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

			const dx = clientX - dragStartRef.current.x;
			const dy = clientY - dragStartRef.current.y;

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

	const onPointerUp = useCallback(() => {
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
			onMouseDown: onPointerDown,
			onMouseMove: onPointerMove,
			onMouseUp: onPointerUp,
			onMouseLeave: onPointerUp,
			onTouchStart: onPointerDown,
			onTouchMove: onPointerMove,
			onTouchEnd: onPointerUp
		}
	};
}
