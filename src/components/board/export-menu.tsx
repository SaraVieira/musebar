import { Braces, Download, FileImage, FileType } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { exportBoardAsPng, exportBoardAsSvg } from "#/lib/board/export";
import { exportFilename } from "#/lib/board/portable";
import { downloadJson } from "#/lib/download";
import { exportProject } from "#/lib/projects-server";

export function ExportMenu({
	projectId,
	projectName,
}: {
	projectId: string;
	projectName: string;
}) {
	const [busy, setBusy] = useState<"png" | "svg" | "json" | null>(null);

	async function run(kind: "png" | "svg" | "json") {
		setBusy(kind);
		try {
			if (kind === "png") await exportBoardAsPng(projectName);
			else if (kind === "svg") await exportBoardAsSvg(projectName);
			else {
				const board = await exportProject({ data: { id: projectId } });
				if (!board) throw new Error("Board not found");
				downloadJson(board, exportFilename(projectName, "json"));
			}
		} catch (err) {
			toast.error("Export failed", {
				description: err instanceof Error ? err.message : JSON.stringify(err),
			});
		} finally {
			setBusy(null);
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
						aria-label="Export board"
						title="Export board"
					>
						<Download aria-hidden />
					</Button>
				)}
			/>
			<PopoverContent align="end" className="w-56 p-1">
				<button
					type="button"
					onClick={() => run("png")}
					disabled={busy !== null}
					className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none disabled:opacity-50"
				>
					<FileImage className="size-4" />
					<span className="flex-1">Download as PNG</span>
					{busy === "png" ? (
						<span className="text-xs opacity-60">…</span>
					) : null}
				</button>
				<button
					type="button"
					onClick={() => run("svg")}
					disabled={busy !== null}
					className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none disabled:opacity-50"
				>
					<FileType className="size-4" />
					<span className="flex-1">Download as SVG</span>
					{busy === "svg" ? (
						<span className="text-xs opacity-60">…</span>
					) : null}
				</button>
				<button
					type="button"
					onClick={() => run("json")}
					disabled={busy !== null}
					className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none disabled:opacity-50"
				>
					<Braces className="size-4" />
					<span className="flex-1">Download as JSON</span>
					{busy === "json" ? (
						<span className="text-xs opacity-60">…</span>
					) : null}
				</button>
			</PopoverContent>
		</Popover>
	);
}
