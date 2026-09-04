export async function mapWithConcurrency<T, R>(
	items: readonly T[],
	limit: number,
	fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
	const results = new Array<R>(items.length);
	if (items.length === 0) return results;

	const workers = Math.max(1, Math.min(Math.trunc(limit), items.length));
	let cursor = 0;

	async function work() {
		while (true) {
			const index = cursor++;
			if (index >= items.length) return;
			results[index] = await fn(items[index], index);
		}
	}

	await Promise.all(Array.from({ length: workers }, work));
	return results;
}
