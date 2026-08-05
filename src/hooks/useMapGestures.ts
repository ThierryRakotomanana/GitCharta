import { useCallback, useRef, useState } from "react";

const DRAG_THRESHOLD_PX = 6;

interface UseMapGesturesOptions {
	enabled: boolean;
	onDrag: (dx: number, dy: number) => void;
	onDragStart?: () => void;
	onDragEnd?: () => void;
}

export function useMapGestures({
	enabled,
	onDrag,
	onDragStart,
	onDragEnd
}: UseMapGesturesOptions) {
	const [isDragging, setIsDragging] = useState(false);
	const didDragRef = useRef(false);
	const startPosRef = useRef<{ x: number; y: number } | null>(null);
	const capturedRef = useRef(false);

	const onPointerDown = useCallback(
		(e: React.PointerEvent) => {
			if (!enabled || e.button !== 0) return;

			didDragRef.current = false;
			capturedRef.current = false;
			startPosRef.current = { x: e.clientX, y: e.clientY };
		},
		[enabled]
	);

	const onPointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!startPosRef.current || !enabled) return;

			const dx = e.clientX - startPosRef.current.x;
			const dy = e.clientY - startPosRef.current.y;

			if (!didDragRef.current) {
				if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

				didDragRef.current = true;
				setIsDragging(true);
				onDragStart?.();

				if (e.currentTarget.setPointerCapture) {
					try {
						e.currentTarget.setPointerCapture(e.pointerId);
						capturedRef.current = true;
					} catch (err) {
						console.warn("Failed to set pointer capture:", err);
					}
				}
			}

			onDrag(dx, dy);
			startPosRef.current = { x: e.clientX, y: e.clientY };
		},
		[enabled, onDrag, onDragStart]
	);

	const onPointerUp = useCallback(
		(e: React.PointerEvent) => {
			if (startPosRef.current) {
				if (
					capturedRef.current
					&& e.currentTarget.hasPointerCapture?.(e.pointerId)
				) {
					try {
						e.currentTarget.releasePointerCapture(e.pointerId);
					} catch (err) {
						console.warn("Failed to release pointer capture:", err);
					}
				}
				if (didDragRef.current) {
					onDragEnd?.();
				}
			}
			startPosRef.current = null;
			setIsDragging(false);
		},
		[onDragEnd]
	);

	const onClickCapture = useCallback((e: React.MouseEvent) => {
		if (didDragRef.current) {
			e.stopPropagation();
			e.preventDefault();
			didDragRef.current = false;
		}
	}, []);

	return {
		isDragging,
		didDrag: () => didDragRef.current,
		gestureHandlers: {
			onPointerDown,
			onPointerMove,
			onPointerUp,
			onPointerLeave: onPointerUp,
			onPointerCancel: onPointerUp,
			onClickCapture
		}
	};
}
