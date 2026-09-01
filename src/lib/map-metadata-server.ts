import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function decode(s: string | undefined) {
  if (!s) return "";
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function pick(html: string, re: RegExp) {
  return html.match(re)?.[1]?.trim();
}

function prettyPathSegment(seg: string) {
  return decode(decodeURIComponent(seg.replace(/\+/g, " "))).trim();
}

function coordsFrom(url: string) {
  const m = url.match(
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?)z)?/,
  );
  if (!m) return null;
  const zoom = Math.max(1, Math.min(20, Math.round(Number(m[3]) || 15)));
  return { lat: m[1], lng: m[2], zoom };
}

function buildMapSrc(url: string, fallbackName: string | null): string {
  const c = coordsFrom(url);
  if (c) {
    return `https://maps.google.com/maps?ll=${c.lat},${c.lng}&z=${c.zoom}&output=embed`;
  }
  try {
    const u = new URL(url);
    const q =
      u.searchParams.get("q") ??
      u.pathname.match(/\/maps\/place\/([^/@]+)/)?.[1] ??
      u.pathname.match(/\/maps\/search\/([^/@]+)/)?.[1] ??
      fallbackName ??
      null;
    if (q) {
      const decoded = prettyPathSegment(q);
      return `https://maps.google.com/maps?q=${encodeURIComponent(decoded)}&output=embed`;
    }
  } catch {}
  return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&output=embed`;
}

function placeNameFrom(url: string): string | null {
  try {
    const u = new URL(url);
    const place = u.pathname.match(/\/maps\/place\/([^/@]+)/)?.[1];
    if (place) return prettyPathSegment(place);
    const search = u.pathname.match(/\/maps\/search\/([^/@]+)/)?.[1];
    if (search) return prettyPathSegment(search);
    const q = u.searchParams.get("q");
    if (q) return prettyPathSegment(q);
  } catch {}
  return null;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Musebar/1.0; +https://musebar.local)",
        Accept: "text/html,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export const fetchMapMetadata = createServerFn({ method: "POST" })
  .validator(z.object({ url: z.string().url() }))
  .handler(async ({ data }) => {
    let resolvedUrl = data.url;
    const initialHost = (() => {
      try {
        return new URL(data.url).hostname.toLowerCase();
      } catch {
        return "";
      }
    })();
    const isShortlink =
      initialHost === "maps.app.goo.gl" || initialHost === "goo.gl";

    if (isShortlink) {
      try {
        const res = await fetch(data.url, {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; Musebar/1.0; +https://musebar.local)",
            Accept: "text/html,*/*;q=0.8",
          },
          redirect: "follow",
          signal: AbortSignal.timeout(6000),
        });
        if (res.url) resolvedUrl = res.url;
      } catch {}
    }

    const html = await fetchHtml(resolvedUrl);
    const ogTitle =
      html &&
      (pick(
        html,
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      ) ??
        pick(
          html,
          /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
        ) ??
        pick(html, /<title[^>]*>([^<]+)<\/title>/i));
    const ogDesc =
      html &&
      (pick(
        html,
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      ) ??
        pick(
          html,
          /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
        ));

    const nameFromUrl = placeNameFrom(resolvedUrl);
    // Google Maps often returns a generic "Google Maps" as og:title, so prefer
    // the URL-derived place name when we have one.
    const rawTitle = nameFromUrl || decode(ogTitle || "") || "Google Maps";
    const title = rawTitle.replace(/\s*-\s*Google Maps\s*$/i, "").trim();

    const coords = coordsFrom(resolvedUrl);
    const coordString = coords ? `${coords.lat}, ${coords.lng}` : "";
    const address =
      decode(ogDesc || "") ||
      (nameFromUrl && coordString ? coordString : coordString);

    const mapSrc = buildMapSrc(resolvedUrl, nameFromUrl);

    return {
      url: resolvedUrl,
      mapSrc,
      title,
      address,
    };
  });
