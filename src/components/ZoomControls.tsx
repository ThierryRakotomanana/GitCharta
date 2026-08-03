import { Minus, Plus, RotateCcw } from "lucide-react";

interface ZoomControlsProps {
	zoomIn: () => void;
	zoomOut: () => void;
	resetZoom: () => void;
	canZoomIn: boolean;
	canZoomOut: boolean;
	isZoomed: boolean;
	zoom: number;
}

export const ZoomControls = ({
	zoomIn,
	zoomOut,
	resetZoom,
	canZoomIn,
	canZoomOut,
	isZoomed,
	zoom
}: ZoomControlsProps) => {
	return (
		<div className='flex flex-col items-center bg-card/85 backdrop-blur-md border border-border/50 rounded-lg shadow-md p-1 gap-1 divide-y divide-border/40 select-none'>
			<div className='flex flex-col gap-0.5'>
				<button
					type='button'
					onClick={zoomIn}
					disabled={!canZoomIn}
					aria-label='Zoom in'
					title='Zoom in'
					className='h-8 w-8 flex items-center justify-center rounded-md text-foreground hover:bg-muted/80 disabled:opacity-40 disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer'>
					<Plus className='h-4 w-4' />
				</button>
				<button
					type='button'
					onClick={zoomOut}
					disabled={!canZoomOut}
					aria-label='Zoom out'
					title='Zoom out'
					className='h-8 w-8 flex items-center justify-center rounded-md text-foreground hover:bg-muted/80 disabled:opacity-40 disabled:hover:bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer'>
					<Minus className='h-4 w-4' />
				</button>
			</div>

			{isZoomed && (
				<div className='pt-1 flex flex-col items-center gap-1'>
					<button
						type='button'
						onClick={resetZoom}
						aria-label='Reset zoom'
						title='Reset zoom'
						className='h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer'>
						<RotateCcw className='h-3.5 w-3.5' />
					</button>
					<span className='text-[9px] font-mono font-medium text-muted-foreground pb-0.5'>
						{Math.round(zoom * 100)}%
					</span>
				</div>
			)}
		</div>
	);
};
