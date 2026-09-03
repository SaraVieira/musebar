import { cn } from "#/lib/utils";

export function Skeleton({ className }: { className?: string }) {
	return (
		<div className={cn("animate-pulse rounded bg-gray-300/70", className)} />
	);
}

export function NodeUploadOverlay({
	name,
	progress,
}: {
	name: string;
	progress?: number;
}) {
	const pct = Math.round(Math.min(1, Math.max(0, progress ?? 0)) * 100);
	return (
		<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-neutral-900/85 p-3 text-white">
			<span className="max-w-full truncate text-xs font-medium">{name}</span>
			<div
				className="h-1.5 w-3/4 overflow-hidden rounded-full bg-white/20"
				role="progressbar"
				aria-label={`Uploading ${name}`}
				aria-valuenow={pct}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<div
					className="h-full rounded-full bg-white transition-[width] duration-150"
					style={{ width: `${pct}%` }}
				/>
			</div>
			<span className="text-[10px] tabular-nums opacity-70">{pct}%</span>
		</div>
	);
}
