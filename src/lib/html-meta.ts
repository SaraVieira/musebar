import { lookup } from "node:dns/promises";
import { env } from "#/env";
import { isAllowedProtocol, isBlockedAddress } from "#/lib/net-guard";

const USER_AGENT =
	"Mozilla/5.0 (compatible; Musebar/1.0; +https://musebar.local)";
const FETCH_TIMEOUT_MS = 6000;
const MAX_BYTES = 1024 * 1024; // 1MB is far more than any <head> needs
const MAX_REDIRECTS = 5;

const allowPrivate = Boolean(env.ALLOW_PRIVATE_METADATA_FETCH);

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

async function assertFetchable(url: URL): Promise<void> {
	if (!isAllowedProtocol(url)) {
		throw new Error(`Unsupported protocol: ${url.protocol}`);
	}
	if (allowPrivate) return;

	const addresses = await lookup(url.hostname, { all: true });
	if (addresses.length === 0) {
		throw new Error(`Could not resolve ${url.hostname}`);
	}
	for (const { address } of addresses) {
		if (isBlockedAddress(address)) {
			throw new Error(`Refusing to fetch a private address (${url.hostname})`);
		}
	}
}

async function readCapped(res: Response): Promise<string> {
	const body = res.body;
	if (!body) return "";
	const reader = body.getReader();
	const decoder = new TextDecoder();
	const chunks: string[] = [];
	let total = 0;
	try {
		while (total < MAX_BYTES) {
			const { done, value } = await reader.read();
			if (done) break;
			total += value.byteLength;
			chunks.push(decoder.decode(value, { stream: true }));
		}
	} finally {
		await reader.cancel().catch(() => {});
	}
	return chunks.join("");
}

function isRedirect(status: number): boolean {
	return (
		status === 301 ||
		status === 302 ||
		status === 303 ||
		status === 307 ||
		status === 308
	);
}

export async function fetchHtml(url: string): Promise<string | null> {
	try {
		let current = new URL(url);

		for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
			await assertFetchable(current);

			const res = await fetch(current, {
				method: "GET",
				headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*;q=0.8" },
				redirect: "manual",
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			});

			if (isRedirect(res.status)) {
				const location = res.headers.get("location");
				if (!location) return null;
				await res.body?.cancel().catch(() => {});
				current = new URL(location, current);
				continue;
			}

			if (!res.ok) return null;

			const type = res.headers.get("content-type") ?? "";
			if (type && !type.includes("html") && !type.includes("text")) {
				await res.body?.cancel().catch(() => {});
				return null;
			}

			return await readCapped(res);
		}
		return null; // too many redirects
	} catch {
		return null;
	}
}
