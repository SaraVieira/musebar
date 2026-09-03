import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { CREATABLE_NODES } from "#/lib/board/node-types";

interface Shortcut {
	keys: string[];
	label: string;
}

const GROUPS: { name: string; items: Shortcut[] }[] = [
	{
		name: "Add",
		// Derived so the dialog cannot drift from the keys actually bound.
		items: CREATABLE_NODES.map(({ label, shortcut }) => ({
			keys: [shortcut.toUpperCase()],
			label: `New ${label.toLowerCase()}`,
		})),
	},
	{
		name: "Edit",
		items: [
			{ keys: ["⌘", "Z"], label: "Undo" },
			{ keys: ["⇧", "⌘", "Z"], label: "Redo" },
			{ keys: ["⌘", "D"], label: "Duplicate selection" },
			{ keys: ["Del"], label: "Delete selection" },
		],
	},
	{
		name: "Keyboard navigation",
		items: [
			{ keys: ["Tab"], label: "Move focus between nodes" },
			{ keys: ["Enter"], label: "Edit the focused node" },
			{ keys: ["Esc"], label: "Stop editing / deselect" },
			{ keys: ["Arrows"], label: "Move the selected node" },
			{ keys: ["⇧", "Arrows"], label: "Move it further" },
		],
	},
	{
		name: "Canvas",
		items: [
			{ keys: ["Right-click", "node"], label: "Node actions menu" },
			{ keys: ["Right-click", "canvas"], label: "Add menu" },
			{ keys: ["Drop", "file"], label: "Upload as image / file card" },
			{ keys: ["Paste", "URL"], label: "Bookmark or embed" },
		],
	},
	{
		name: "Help",
		items: [{ keys: ["⌘", "/"], label: "Show this panel" }],
	},
];

export function ShortcutsDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Keyboard shortcuts</DialogTitle>
					<DialogDescription>
						Fastest way to move around the board.
					</DialogDescription>
				</DialogHeader>
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					{GROUPS.map((group) => (
						<div key={group.name}>
							<h3 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
								{group.name}
							</h3>
							<ul className="flex flex-col gap-2">
								{group.items.map((s) => (
									<li
										key={s.label}
										className="flex items-center justify-between gap-2 text-sm"
									>
										<span>{s.label}</span>
										<span className="flex shrink-0 items-center gap-1">
											{s.keys.map((k) => (
												<kbd
													key={`${s.label}-${k}`}
													className="text-foreground border-border bg-background inline-flex h-6 min-w-6 items-center justify-center rounded border px-1.5 font-sans text-[11px] font-medium shadow-[inset_0_-1px_0_var(--border)]"
												>
													{k}
												</kbd>
											))}
										</span>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}
