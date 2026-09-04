import { Check, Copy, RefreshCw, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { Label } from "#/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { Switch } from "#/components/ui/switch";
import { rotateShareToken, setProjectVisibility } from "#/lib/projects-server";

export function ShareMenu({
	projectId,
	isPublic,
	shareToken,
	onChange,
}: {
	projectId: string;
	isPublic: boolean;
	shareToken: string | null;
	onChange: (next: { isPublic: boolean; shareToken: string | null }) => void;
}) {
	const [busy, setBusy] = useState(false);
	const [copied, setCopied] = useState(false);
	// Built in the browser, so it uses the host the user is actually on.
	const shareUrl =
		typeof window === "undefined" || !shareToken
			? ""
			: `${window.location.origin}/s/${shareToken}`;

	async function toggle(next: boolean) {
		setBusy(true);
		try {
			onChange(
				await setProjectVisibility({
					data: { id: projectId, isPublic: next },
				}),
			);
		} catch (err) {
			toast.error("Couldn't change sharing", {
				description: err instanceof Error ? err.message : undefined,
			});
		} finally {
			setBusy(false);
		}
	}

	async function rotate() {
		setBusy(true);
		try {
			const { shareToken: next } = await rotateShareToken({
				data: { id: projectId },
			});
			onChange({ isPublic: true, shareToken: next });
			toast.success("New link created", {
				description: "The previous link no longer works.",
			});
		} catch (err) {
			toast.error("Couldn't create a new link", {
				description: err instanceof Error ? err.message : undefined,
			});
		} finally {
			setBusy(false);
		}
	}

	async function copy() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Couldn't copy the link");
		}
	}

	return (
		<Popover>
			<PopoverTrigger
				render={(props) => (
					<Button
						{...props}
						variant="ghost"
						size="icon"
						aria-label="Share board"
						title={isPublic ? "Shared via link" : "Share board"}
					>
						<Share2 aria-hidden />
					</Button>
				)}
			/>
			<PopoverContent align="end" className="w-80 p-3">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<Label htmlFor="share-toggle" className="text-sm">
							Share via link
						</Label>
						<p className="text-muted-foreground mt-1 text-xs">
							Anyone with the link can view this board. They cannot edit it.
						</p>
					</div>
					<Switch
						id="share-toggle"
						checked={isPublic}
						disabled={busy}
						onCheckedChange={toggle}
					/>
				</div>

				{isPublic ? (
					<div className="mt-3 flex items-center gap-2">
						<input
							readOnly
							value={shareUrl}
							onFocus={(e) => e.currentTarget.select()}
							aria-label="Share link"
							className="bg-muted min-w-0 flex-1 rounded border px-2 py-1 text-xs"
						/>
						<Button
							variant="secondary"
							size="icon"
							onClick={copy}
							aria-label="Copy share link"
							className="h-7 w-7 shrink-0"
						>
							{copied ? (
								<Check aria-hidden className="size-3.5" />
							) : (
								<Copy aria-hidden className="size-3.5" />
							)}
						</Button>
					</div>
				) : null}

				{isPublic ? (
					<button
						type="button"
						onClick={rotate}
						disabled={busy}
						className="text-muted-foreground hover:text-foreground mt-3 flex items-center gap-1.5 text-xs disabled:opacity-50"
					>
						<RefreshCw aria-hidden className="size-3" />
						Create a new link and revoke the old one
					</button>
				) : null}
			</PopoverContent>
		</Popover>
	);
}
