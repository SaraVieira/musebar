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
import { updateProject } from "#/lib/projects-server";

interface Project {
	id: string;
	name: string;
	description: string | null;
}

export function EditProjectDialog({
	project,
	open,
	onOpenChange,
	onSaved,
}: {
	project: Project | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void | Promise<void>;
}) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (open && project) {
			setName(project.name);
			setDescription(project.description ?? "");
		}
	}, [open, project]);

	const trimmedName = name.trim();
	const trimmedDescription = description.trim();
	const canSubmit =
		!!project &&
		trimmedName.length > 0 &&
		!busy &&
		(trimmedName !== project.name ||
			trimmedDescription !== (project.description ?? ""));

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		if (!canSubmit || !project) return;
		setBusy(true);
		try {
			await updateProject({
				data: {
					id: project.id,
					name: trimmedName,
					description: trimmedDescription || null,
				},
			});
			await onSaved();
			onOpenChange(false);
		} catch (err) {
			toast.error("Couldn't save changes", {
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
						<DialogTitle>Edit project</DialogTitle>
						<DialogDescription>
							Rename or add a short description.
						</DialogDescription>
					</DialogHeader>
					<div className="mt-4 flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="project-name">Name</Label>
							<Input
								id="project-name"
								autoFocus
								value={name}
								onChange={(e) => setName(e.target.value)}
								maxLength={120}
								required
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="project-description">Description</Label>
							<Input
								id="project-description"
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
						<Button type="submit" disabled={!canSubmit}>
							{busy ? "Saving…" : "Save"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
