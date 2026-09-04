const ASSET_URL_RE = /\/api\/assets\/([A-Za-z0-9_-]+)/g;

// Scans the raw JSON rather than walking typed nodes, so any node type that
// gains an asset URL is covered without changes here.
export function referencedAssetIds(content: string | null): Set<string> {
	const ids = new Set<string>();
	if (!content) return ids;
	for (const match of content.matchAll(ASSET_URL_RE)) {
		ids.add(match[1]);
	}
	return ids;
}
