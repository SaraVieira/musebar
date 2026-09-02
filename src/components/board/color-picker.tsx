import { cn } from "#/lib/utils";

export const CARD_COLORS = [
	{ name: "Yellow", value: "#ffe58a" },
	{ name: "Mint", value: "#a8f0d0" },
	{ name: "Blue", value: "#9ec8ff" },
	{ name: "Purple", value: "#c9a8ff" },
	{ name: "Pink", value: "#ffb3d1" },
	{ name: "Orange", value: "#ffb38a" },
	{ name: "White", value: "#ffffff" },
] as const;

export function ColorPicker({
	selected,
	onSelect,
}: {
	selected: string;
	onSelect: (color: string) => void;
}) {
	return (
		<div
			onPointerDown={(e) => e.stopPropagation()}
			className="absolute bottom-full left-1/2 z-10 mb-2 flex -translate-x-1/2 gap-1 rounded-full bg-white p-1.5 shadow-lg"
		>
			{CARD_COLORS.map((c) => {
				const isSelected = c.value === selected;
				const isWhite = c.value === "#ffffff";
				return (
					<button
						key={c.value}
						type="button"
						title={c.name}
						aria-label={c.name}
						onPointerDown={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onSelect(c.value);
						}}
						style={{ background: c.value }}
						className={cn(
							"size-5 cursor-pointer rounded-full border-0 p-0 outline-none",
							isWhite && "border border-black/15",
							isSelected &&
								"ring-2 ring-gray-900 ring-offset-2 ring-offset-white",
						)}
					/>
				);
			})}
		</div>
	);
}
