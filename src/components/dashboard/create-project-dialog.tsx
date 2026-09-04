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
import { BOARD_TEMPLATES } from "#/lib/board/templates";
import { createProject } from "#/lib/projects-server";
import { cn } from "#/lib/utils";

export function CreateProjectDialog({
	open,
	onOpenChange,
	onCreated,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreated: (id: string) => void | Promise<void>;
}) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [busy, setBusy] = useState(false);
	const [templateKey, setTemplateKey] = useState(BOARD_TEMPLATES[0].key);

	useEffect(() => {
		if (open) {
			setName("");
			setDescription("");
			setTemplateKey(BOARD_TEMPLATES[0].key);
		}
	}, [open]);

	const trimmedName = name.trim();
	const trimmedDescription = description.trim();
	const canSubmit = trimmedName.length > 0 && !busy;

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		if (!canSubmit) return;
		setBusy(true);
		try {
			const template = BOARD_TEMPLATES.find((t) => t.key === templateKey);
			const { id } = await createProject({
				data: {
					name: trimmedName,
					description: trimmedDescription || undefined,
					content: template?.build?.(),
				},
			});
			await onCreated(id);
			onOpenChange(false);
		} catch (err) {
			toast.error("Couldn't create the project", {
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
						<DialogTitle>New project</DialogTitle>
						<DialogDescription>
							Give your board a name and an optional description.
						</DialogDescription>
					</DialogHeader>
					<div className="mt-4 flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="new-project-name">Name</Label>
							<Input
								id="new-project-name"
								autoFocus
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g. Website redesign"
								maxLength={120}
								required
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="new-project-description">Description</Label>
							<Input
								id="new-project-description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Optional"
								maxLength={500}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label>Start from</Label>
							<div className="grid grid-cols-2 gap-2">
								{BOARD_TEMPLATES.map((t) => {
									const selected = t.key === templateKey;
									return (
										<button
											key={t.key}
											type="button"
											onClick={() => setTemplateKey(t.key)}
											aria-pressed={selected}
											className={cn(
												"rounded-lg border p-3 text-left transition-colors",
												selected
													? "border-foreground/40 bg-accent"
													: "hover:bg-accent/50",
											)}
										>
											<div className="text-sm font-medium">{t.name}</div>
											<div className="text-muted-foreground mt-0.5 text-xs">
												{t.description}
											</div>
										</button>
									);
								})}
							</div>
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
						<Button type="submit" disabled={!canSubmit}>
							{busy ? "Creating…" : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
