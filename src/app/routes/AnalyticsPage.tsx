import { BarChart3 } from "lucide-react";

export function AnalyticsPage() {
	return (
		<div className='flex flex-1 flex-col items-center justify-center gap-3 text-center'>
			<BarChart3 className='h-8 w-8 text-muted-foreground' />
			<p className='text-sm font-medium text-foreground'>
				Analytics is coming soon
			</p>
			<p className='max-w-xs text-xs text-muted-foreground'>
				Deeper trends and breakdowns for your audience will live here.
			</p>
		</div>
	);
}
