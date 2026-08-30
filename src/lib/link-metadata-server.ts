import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function pick(html: string, re: RegExp) {
  return html.match(re)?.[1]?.trim();
}

function decode(s: string | undefined) {
  if (!s) return "";
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export const fetchLinkMetadata = createServerFn({ method: "POST" })
  .validator(z.object({ url: z.string().url() }))
  .handler(async ({ data }) => {
    const fallback = {
      title: new URL(data.url).hostname,
      description: "",
      image: "",
      favicon: `${new URL(data.url).origin}/favicon.ico`,
    };
    try {
      const res = await fetch(data.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; Musebar/1.0; +https://musebar.local)",
          Accept: "text/html,*/*;q=0.8",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return fallback;
      const html = await res.text();

      const title =
        pick(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
        pick(html, /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) ??
        pick(html, /<title[^>]*>([^<]+)<\/title>/i) ??
        fallback.title;
      const description =
        pick(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ??
        pick(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ??
        "";
      const image =
        pick(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
        pick(html, /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ??
        "";
      const favicon =
        pick(html, /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i) ??
        pick(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i) ??
        fallback.favicon;

      const absolute = (u: string) => (u ? new URL(u, data.url).toString() : "");

      return {
        title: decode(title),
        description: decode(description),
        image: absolute(image),
        favicon: absolute(favicon),
      };
    } catch {
      return fallback;
    }
  });
