import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { decode, fetchHtml, pick } from "#/lib/html-meta";

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
			const html = await fetchHtml(data.url);
			if (html === null) return fallback;

			const title =
				pick(
					html,
					/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
				) ??
				pick(
					html,
					/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
				) ??
				pick(html, /<title[^>]*>([^<]+)<\/title>/i) ??
				fallback.title;
			const description =
				pick(
					html,
					/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
				) ??
				pick(
					html,
					/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
				) ??
				"";
			const image =
				pick(
					html,
					/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
				) ??
				pick(
					html,
					/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
				) ??
				"";
			const favicon =
				pick(
					html,
					/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
				) ??
				pick(
					html,
					/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
				) ??
				fallback.favicon;

			const absolute = (u: string) =>
				u ? new URL(u, data.url).toString() : "";

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
