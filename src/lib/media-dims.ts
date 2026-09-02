export function readImageDims(file: File): Promise<{ w: number; h: number }> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			resolve({ w: img.naturalWidth, h: img.naturalHeight });
			URL.revokeObjectURL(url);
		};
		img.onerror = (err) => {
			URL.revokeObjectURL(url);
			reject(err);
		};
		img.src = url;
	});
}

export function readImageDimsFromUrl(
	url: string,
): Promise<{ w: number; h: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
		img.onerror = reject;
		img.src = url;
	});
}
