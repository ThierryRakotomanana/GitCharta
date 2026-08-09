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
		<div className='flex flex-col w-full select-none'>
			<button
				type='button'
				onClick={zoomIn}
				disabled={!canZoomIn}
				aria-label='Zoom in'
				title='Zoom in'
				className='p-2.5 flex items-center justify-center hover:bg-muted/50 transition-colors focus:outline-none group disabled:opacity-50'>
				<Plus className='h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors' />
			</button>

			<div className='h-px w-full bg-border/40' />

			<button
				type='button'
				onClick={zoomOut}
				disabled={!canZoomOut}
				aria-label='Zoom out'
				title='Zoom out'
				className='p-2.5 flex items-center justify-center hover:bg-muted/50 transition-colors focus:outline-none group disabled:opacity-50'>
				<Minus className='h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors' />
			</button>

			<div
				className={`grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
					isZoomed ?
						"grid-rows-[1fr] opacity-100"
					:	"grid-rows-[0fr] opacity-0 pointer-events-none"
				}`}>
				<div className='overflow-hidden flex flex-col w-full'>
					<div className='h-px w-full bg-border/40' />
					<button
						type='button'
						onClick={resetZoom}
						tabIndex={isZoomed ? 0 : -1}
						aria-label='Reset zoom'
						title='Reset zoom'
						className='px-3 py-2 flex flex-col items-center gap-1 hover:bg-muted/50 transition-colors focus:outline-none group'>
						<RotateCcw className='h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors' />
						<span className='text-[9px] font-mono font-medium text-muted-foreground group-hover:text-primary transition-colors'>
							{Math.round(zoom * 100)}%
						</span>
					</button>
				</div>
			</div>
		</div>
	);
};
