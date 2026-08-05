import { useCallback, useState } from "react";
import type { WorldGeoJson } from "@/hooks/useCountryPaths";
import type { MAP_MODE } from "@/App";
import { useMapGestures } from "@/hooks/useMapGestures";
import { useGlobeAnimation } from "@/hooks/useGlobeAnimation";

const BASE_DRAG_SENSITIVITY = 0.4;

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

	if (zoom <= 1 && (pan[0] !== 0 || pan[1] !== 0)) {
		setPan([0, 0]);
	}

	const effectivePan: [number, number] = zoom <= 1 ? [0, 0] : pan;

	const { cancelAnimation } = useGlobeAnimation(
		selectedCountry,
		geoJson,
		isGlobe,
		rotation,
		setRotation
	);

	const handleDrag = useCallback(
		(dx: number, dy: number) => {
			if (isGlobe) {
				const sensitivity = BASE_DRAG_SENSITIVITY / zoom;
				setRotation(([r0, r1]) => [
					r0 + dx * sensitivity,
					Math.max(-90, Math.min(90, r1 - dy * sensitivity)),
					0
				]);
			} else {
				const maxX = Math.max(0, (width * zoom - width) / 2);
				const maxY = Math.max(0, (height * zoom - height) / 2);

				setPan(([p0, p1]) => [
					Math.max(-maxX, Math.min(maxX, p0 + dx)),
					Math.max(-maxY, Math.min(maxY, p1 + dy))
				]);
			}
		},
		[isGlobe, zoom, width, height]
	);

	const { isDragging, didDrag, gestureHandlers } = useMapGestures({
		enabled: isGlobe || zoom > 1,
		onDragStart: cancelAnimation,
		onDrag: handleDrag
	});

	return {
		rotation,
		pan: effectivePan,
		isDragging,
		didDrag,
		dragHandlers: gestureHandlers
	};
}
