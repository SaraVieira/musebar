import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { CREATABLE_NODES } from "#/lib/board/node-types";

const DISMISSED_KEY = "musebar:board-hint-dismissed";

function readDismissed(): boolean {
	try {
		return localStorage.getItem(DISMISSED_KEY) === "1";
	} catch {
		return false;
	}
}

export function BoardEmptyState() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!readDismissed()) setVisible(true);
	}, []);

	if (!visible) return null;

	function dismiss() {
		setVisible(false);
		try {
			localStorage.setItem(DISMISSED_KEY, "1");
		} catch {
			// Non-fatal: the hint reappears on the next empty board.
		}
	}

	return (
		<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
			<div className="bg-card/90 text-card-foreground pointer-events-auto relative max-w-sm rounded-xl border p-6 text-center shadow-lg backdrop-blur">
				<button
					type="button"
					onClick={dismiss}
					aria-label="Dismiss hint"
					className="hover:bg-accent text-muted-foreground absolute top-2 right-2 rounded p-1"
				>
					<X aria-hidden className="size-4" />
				</button>
				<h2 className="text-base font-medium">This board is empty</h2>
				<ul className="text-muted-foreground mt-3 flex flex-col gap-1.5 text-sm">
					<li>Drag in images or files</li>
					<li>Paste a link to embed it</li>
					<li>
						Press{" "}
						{CREATABLE_NODES.map(({ type, label, shortcut }, i) => (
							<span key={type}>
								{i > 0 ? ", " : null}
								<kbd className="text-foreground border-border bg-background rounded border px-1 font-sans text-[11px]">
									{shortcut.toUpperCase()}
								</kbd>{" "}
								for a {label.toLowerCase()}
							</span>
						))}
					</li>
				</ul>
				<p className="text-muted-foreground/80 mt-3 text-xs">
					Right-click the canvas for more, or press ? for all shortcuts.
				</p>
			</div>
		</div>
	);
}
