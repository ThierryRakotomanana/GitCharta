import { Workflow } from "lucide-react";

export function AutomatePage() {
	return (
		<div className='flex flex-1 flex-col items-center justify-center gap-3 text-center'>
			<Workflow className='h-8 w-8 text-muted-foreground' />
			<p className='text-sm font-medium text-foreground'>Automate is coming soon</p>
			<p className='max-w-xs text-xs text-muted-foreground'>
				Scheduled re-checks and alerts for your audience will live here.
			</p>
		</div>
	);
}
