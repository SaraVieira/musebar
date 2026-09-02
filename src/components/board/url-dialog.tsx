import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";

export function UrlDialog({
	open,
	onOpenChange,
	onSubmit,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (url: string) => void | Promise<void>;
}) {
	const [value, setValue] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (!open) {
			setValue("");
			setBusy(false);
		}
	}, [open]);

	const trimmed = value.trim();
	const valid = /^https?:\/\/\S+$/i.test(trimmed);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!valid || busy) return;
		setBusy(true);
		try {
			await onSubmit(trimmed);
			onOpenChange(false);
		} finally {
			setBusy(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Add a link</DialogTitle>
						<DialogDescription>
							Paste a URL. YouTube, Vimeo, and Loom embed inline; anything else
							becomes a bookmark card with preview.
						</DialogDescription>
					</DialogHeader>
					<Input
						autoFocus
						type="url"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						placeholder="https://…"
						className="mt-4"
					/>
					<DialogFooter className="mt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!valid || busy}>
							{busy ? "Adding…" : "Add"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
