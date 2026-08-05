import { useCallback, useEffect, useRef, useState } from "react";
import { geoCentroid } from "d3-geo";
import type { CountryFeature, WorldGeoJson } from "@/hooks/useCountryPaths";
import type { MAP_MODE } from "@/App";

const DRAG_THRESHOLD_PX = 6;
const BASE_DRAG_SENSITIVITY = 0.4;
const ANIMATION_MS = 750;

export function useGlobeRotation(
	selectedCountry: string | null | undefined,
	geoJson: WorldGeoJson | null,
	zoom: number,
	mapMode: MAP_MODE,
	width: number,
	height: number
) {
	const isGlobe = mapMode === "GLOBE";

	const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
	const [pan, setPan] = useState<[number, number]>([0, 0]);
	const [isDragging, setIsDragging] = useState(false);

	const currentRotationRef = useRef(rotation);
	const wasDraggingRef = useRef(false);
	const dragStartRef = useRef<{
		x: number;
		y: number;
		rot: [number, number, number];
		pan: [number, number];
		pointerId: number;
		captured: boolean;
	} | null>(null);
	const animationRef = useRef<number | null>(null);

	useEffect(() => {
		currentRotationRef.current = rotation;
	}, [rotation]);

	useEffect(() => {
		if (zoom <= 1) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setPan([0, 0]);
		}
	}, [zoom]);

	const effectivePan: [number, number] = zoom <= 1 ? [0, 0] : pan;

	const onPointerDown = useCallback(
		(e: React.PointerEvent) => {
			if (animationRef.current) cancelAnimationFrame(animationRef.current);

			if (!isGlobe && zoom <= 1) return;

			wasDraggingRef.current = false;
			dragStartRef.current = {
				x: e.clientX,
				y: e.clientY,
				rot: currentRotationRef.current,
				pan: effectivePan,
				pointerId: e.pointerId,
				captured: false
			};
		},
		[isGlobe, zoom, effectivePan]
	);

	const onPointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!dragStartRef.current) return;

			const dx = e.clientX - dragStartRef.current.x;
			const dy = e.clientY - dragStartRef.current.y;

			if (!wasDraggingRef.current) {
				if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

				wasDraggingRef.current = true;
				setIsDragging(true);

				if (!dragStartRef.current.captured && e.currentTarget.setPointerCapture) {
					try {
						e.currentTarget.setPointerCapture(e.pointerId);
						dragStartRef.current.captured = true;
					} catch {
						// Edge case fallback
					}
				}
			}

			if (isGlobe) {
				const sensitivity = BASE_DRAG_SENSITIVITY / zoom;
				setRotation([
					dragStartRef.current.rot[0] + dx * sensitivity,
					Math.max(
						-90,
						Math.min(90, dragStartRef.current.rot[1] - dy * sensitivity)
					),
					0
				]);
			} else {
				const maxX = Math.max(0, (width * zoom - width) / 2);
				const maxY = Math.max(0, (height * zoom - height) / 2);

				setPan([
					Math.max(-maxX, Math.min(maxX, dragStartRef.current.pan[0] + dx)),
					Math.max(-maxY, Math.min(maxY, dragStartRef.current.pan[1] + dy))
				]);
			}
		},
		[isGlobe, zoom, width, height]
	);

	const onPointerUp = useCallback((e: React.PointerEvent) => {
		if (dragStartRef.current?.captured) {
			try {
				if (
					e.currentTarget.hasPointerCapture
					&& e.currentTarget.hasPointerCapture(e.pointerId)
				) {
					e.currentTarget.releasePointerCapture(e.pointerId);
				}
			} catch (err) {
				console.warn("Failed to release pointer capture:", err);
			}
		}

		dragStartRef.current = null;
		setIsDragging(false);
		setTimeout(() => {
			wasDraggingRef.current = false;
		}, 100);
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
		const startRotation = currentRotationRef.current;

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

		if (animationRef.current) cancelAnimationFrame(animationRef.current);
		animationRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationRef.current) cancelAnimationFrame(animationRef.current);
		};
	}, [selectedCountry, geoJson, isGlobe]);

	return {
		rotation,
		pan: effectivePan,
		isDragging,
		justDragged: () => wasDraggingRef.current,
		dragHandlers: {
			onPointerDown,
			onPointerMove,
			onPointerUp,
			onPointerLeave: onPointerUp,
			onPointerCancel: onPointerUp
		}
	};
}
