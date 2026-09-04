/** Triggers a browser download for generated content. */
function downloadBlob(content: BlobPart, filename: string, type: string) {
	const url = URL.createObjectURL(new Blob([content], { type }));
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

export function downloadJson(value: unknown, filename: string) {
	downloadBlob(JSON.stringify(value, null, 2), filename, "application/json");
}
