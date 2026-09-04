import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { getSession } from "#/lib/auth-server";
import {
	exportFilename,
	PORTABLE_VERSION,
	parseImport,
} from "#/lib/board/portable";
import { downloadJson } from "#/lib/download";
import { exportAllProjects, importProjects } from "#/lib/projects-server";

export const Route = createFileRoute("/settings")({
	beforeLoad: async () => {
		const session = await getSession();
		if (!session) throw redirect({ href: "/login" });
		return { session };
	},
	component: Settings,
});

function Settings() {
	const { session } = Route.useRouteContext();
	const router = useRouter();
	const fileRef = useRef<HTMLInputElement>(null);
	const [busy, setBusy] = useState<"export" | "import" | null>(null);

	async function exportAll() {
		setBusy("export");
		try {
			const archive = await exportAllProjects();
			const stamp = new Date().toISOString().slice(0, 10);
			downloadJson(archive, exportFilename(`musebar-backup-${stamp}`, "json"));
			toast.success(
				`Exported ${archive.boards.length} ${archive.boards.length === 1 ? "board" : "boards"}`,
			);
		} catch (err) {
			toast.error("Couldn't export", {
				description: err instanceof Error ? err.message : undefined,
			});
		} finally {
			setBusy(null);
		}
	}

	async function importFile(file: File) {
		setBusy("import");
		try {
			const parsed = parseImport(JSON.parse(await file.text()));
			if (!parsed.ok) {
				toast.error("Couldn't import that file", { description: parsed.error });
				return;
			}
			const { created } = await importProjects({
				data: { boards: parsed.boards },
			});
			toast.success(
				`Imported ${created.length} ${created.length === 1 ? "board" : "boards"}`,
			);
			await router.invalidate();
		} catch (err) {
			toast.error("Couldn't import that file", {
				description: err instanceof Error ? err.message : "Not valid JSON.",
			});
		} finally {
			setBusy(null);
		}
	}

	return (
		<div className="bg-background flex min-h-screen flex-col">
			<header className="bg-background flex items-center gap-2 border-b px-6 py-3">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.navigate({ href: "/dashboard" })}
				>
					<ArrowLeft aria-hidden />
					Back
				</Button>
			</header>

			<main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
				<h1 className="text-3xl font-semibold tracking-tight">Settings</h1>

				<section className="mt-10">
					<h2 className="text-lg font-medium">Account</h2>
					<p className="text-muted-foreground mt-2 text-sm">
						Signed in as {session.user.email}
					</p>
				</section>

				<section className="mt-10">
					<h2 className="text-lg font-medium">Data</h2>
					<p className="text-muted-foreground mt-2 text-sm">
						Exports include every board's contents and its uploaded files, so a
						backup restores on its own. Format version {PORTABLE_VERSION}.
					</p>

					<div className="mt-4 flex flex-wrap gap-3">
						<Button onClick={exportAll} disabled={busy !== null}>
							<Download aria-hidden />
							{busy === "export" ? "Exporting…" : "Export all boards"}
						</Button>
						<Button
							variant="outline"
							onClick={() => fileRef.current?.click()}
							disabled={busy !== null}
						>
							<Upload aria-hidden />
							{busy === "import" ? "Importing…" : "Import from file"}
						</Button>
					</div>
					<p className="text-muted-foreground/80 mt-3 text-xs">
						Importing always creates new boards. It never overwrites what you
						already have.
					</p>

					<input
						ref={fileRef}
						type="file"
						accept="application/json,.json"
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0];
							e.target.value = "";
							if (file) void importFile(file);
						}}
					/>
				</section>
			</main>
		</div>
	);
}
