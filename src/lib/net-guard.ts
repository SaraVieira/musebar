/**
 * Classifies IP addresses that server-side fetches must not reach.
 *
 * Pure and dependency-free so it can be tested exhaustively; the DNS lookup
 * that feeds it lives in `html-meta.ts`.
 */

/** Unparseable input is treated as blocked — fail closed. */
function isBlockedIpv4(ip: string): boolean {
	const parts = ip.split(".");
	if (parts.length !== 4) return true;
	const [a, b, c] = parts.map(Number);
	if (
		parts.some((p) => p === "" || !/^\d+$/.test(p)) ||
		[a, b, c].some((n) => !Number.isInteger(n) || n < 0 || n > 255)
	) {
		return true;
	}

	if (a === 0) return true; // 0.0.0.0/8 "this network"
	if (a === 10) return true; // private
	if (a === 127) return true; // loopback
	if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
	if (a === 172 && b >= 16 && b <= 31) return true; // private
	if (a === 192 && b === 168) return true; // private
	if (a === 192 && b === 0 && (c === 0 || c === 2)) return true; // protocol / TEST-NET-1
	if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
	if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
	if (a === 198 && b === 51 && c === 100) return true; // TEST-NET-2
	if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3
	if (a >= 224) return true; // multicast and reserved, incl. broadcast
	return false;
}

/** `::ffff:127.0.0.1` and `::ffff:7f00:1` both have to resolve to the v4 rules. */
function unwrapIpv4Mapped(ip: string): string | null {
	const dotted = ip.match(/^(?:::ffff:|64:ff9b::)(\d{1,3}(?:\.\d{1,3}){3})$/);
	if (dotted) return dotted[1];

	const hex = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
	if (hex) {
		const high = Number.parseInt(hex[1], 16);
		const low = Number.parseInt(hex[2], 16);
		return [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
	}
	return null;
}

function isBlockedIpv6(ip: string): boolean {
	const mapped = unwrapIpv4Mapped(ip);
	if (mapped) return isBlockedIpv4(mapped);

	if (ip === "::" || ip === "::1") return true; // unspecified, loopback
	if (/^f[cd]/.test(ip)) return true; // fc00::/7 unique local
	if (/^fe[89ab]/.test(ip)) return true; // fe80::/10 link-local
	if (/^ff/.test(ip)) return true; // ff00::/8 multicast
	if (ip.startsWith("2001:db8")) return true; // documentation
	return false;
}

/**
 * True for loopback, private, link-local, CGNAT, multicast and reserved
 * addresses — anything a public metadata fetch has no business reaching.
 */
export function isBlockedAddress(ip: string): boolean {
	const normalized = ip.trim().toLowerCase().split("%")[0];
	if (normalized === "") return true;
	return normalized.includes(":")
		? isBlockedIpv6(normalized)
		: isBlockedIpv4(normalized);
}

/** Only http(s); rejects file:, ftp:, data: and friends. */
export function isAllowedProtocol(url: URL): boolean {
	return url.protocol === "http:" || url.protocol === "https:";
}
