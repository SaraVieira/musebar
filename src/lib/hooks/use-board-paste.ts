import { useEffect } from "react";

type XY = { x: number; y: number };

function isEditableTarget(t: EventTarget | null) {
	if (!(t instanceof HTMLElement)) return false;
	if (t.isContentEditable) return true;
	const tag = t.tagName;
	return tag === "INPUT" || tag === "TEXTAREA";
}

export function useBoardPaste({
	getCenter,
	onFiles,
	onUrl,
}: {
	getCenter: () => XY;
	onFiles: (files: File[], at: XY) => void | Promise<void>;
	onUrl: (url: string, at: XY) => void | Promise<void>;
}) {
	useEffect(() => {
		async function onPaste(e: ClipboardEvent) {
			if (!e.clipboardData) return;
			if (isEditableTarget(e.target)) return;

			const at = getCenter();
			const files = Array.from(e.clipboardData.files ?? []);
			if (files.length > 0) {
				e.preventDefault();
				await onFiles(files, at);
				return;
			}

			const url =
				e.clipboardData.getData("text/uri-list") ||
				e.clipboardData.getData("text/plain");
			if (url && /^https?:\/\//i.test(url.trim())) {
				e.preventDefault();
				await onUrl(url.trim().split(/\s+/)[0], at);
			}
		}

		window.addEventListener("paste", onPaste);
		return () => window.removeEventListener("paste", onPaste);
	}, [getCenter, onFiles, onUrl]);
}
