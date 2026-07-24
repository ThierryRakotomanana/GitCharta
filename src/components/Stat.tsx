export function Stat({
	label,
	value,
	compact = false
}: {
	label: string;
	value: number;
	compact?: boolean;
}) {
	return (
		<div className='text-center'>
			<p
				className={`font-mono font-medium text-card-foreground ${
					compact ? "text-xs sm:text-sm" : "text-sm"
				}`}>
				{value.toLocaleString()}
			</p>
			<p
				className={`text-muted-foreground uppercase font-medium ${
					compact ?
						"text-[9px] sm:text-[10px] tracking-wide sm:tracking-widest"
					:	"text-[10px] tracking-widest"
				}`}>
				{label}
			</p>
		</div>
	);
}
