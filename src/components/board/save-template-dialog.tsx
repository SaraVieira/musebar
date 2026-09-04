import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Label } from "#/components/ui/label";
import { saveBoardAsTemplate } from "#/lib/projects-server";

export function SaveTemplateDialog({
	projectId,
	projectName,
	open,
	onOpenChange,
}: {
	projectId: string;
	projectName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (open) {
			setName(projectName);
			setDescription("");
		}
	}, [open, projectName]);

	const trimmedName = name.trim();

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		if (!trimmedName || busy) return;
		setBusy(true);
		try {
			await saveBoardAsTemplate({
				data: {
					projectId,
					name: trimmedName,
					description: description.trim() || undefined,
				},
			});
			toast.success(`Saved "${trimmedName}" as a template`);
			onOpenChange(false);
		} catch (err) {
			toast.error("Couldn't save the template", {
				description: err instanceof Error ? err.message : undefined,
			});
		} finally {
			setBusy(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<form onSubmit={submit}>
					<DialogHeader>
						<DialogTitle>Save as template</DialogTitle>
						<DialogDescription>
							Keeps a copy of this board, including its files, to start future
							boards from. Later changes here won't affect it.
						</DialogDescription>
					</DialogHeader>
					<div className="mt-4 flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="template-name">Name</Label>
							<Input
								id="template-name"
								autoFocus
								value={name}
								onChange={(e) => setName(e.target.value)}
								maxLength={120}
								required
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="template-description">Description</Label>
							<Input
								id="template-description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Optional"
								maxLength={500}
							/>
						</div>
					</div>
					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={busy}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!trimmedName || busy}>
							{busy ? "Saving…" : "Save template"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
