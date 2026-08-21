import { useCallback, useState } from "react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.2;

export function useMapZoom(initialZoom = 1) {
	const [zoom, setZoom] = useState(initialZoom);

	const zoomIn = useCallback(() => {
		setZoom((prev) => Math.min(MAX_ZOOM, Number((prev + ZOOM_STEP).toFixed(2))));
	}, []);

	const zoomOut = useCallback(() => {
		setZoom((prev) => Math.max(MIN_ZOOM, Number((prev - ZOOM_STEP).toFixed(2))));
	}, []);

	const resetZoom = useCallback(() => {
		setZoom(1);
	}, []);

	const handleWheel = useCallback((e: React.WheelEvent) => {
		const delta = e.deltaY < 0 ? 0.25 : -0.25;
		setZoom((prev) =>
			Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((prev + delta).toFixed(2))))
		);
	}, []);

	return {
		zoom,
		zoomIn,
		zoomOut,
		resetZoom,
		canZoomIn: zoom < MAX_ZOOM,
		canZoomOut: zoom > MIN_ZOOM,
		isZoomed: zoom !== 1,
		handleWheel
	};
}
