const USER_AGENT =
	"Mozilla/5.0 (compatible; Musebar/1.0; +https://musebar.local)";
const FETCH_TIMEOUT_MS = 6000;

export function pick(html: string, re: RegExp): string | undefined {
	return html.match(re)?.[1]?.trim();
}

export function decode(s: string | undefined): string {
	if (!s) return "";
	return s
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">");
}

export async function fetchHtml(url: string): Promise<string | null> {
	try {
		const res = await fetch(url, {
			method: "GET",
			headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*;q=0.8" },
			redirect: "follow",
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
		});
		if (!res.ok) return null;
		return await res.text();
	} catch {
		return null;
	}
}
