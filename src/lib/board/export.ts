import { toPng, toSvg } from "html-to-image";

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "board"
  );
}

function download(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function findFlowElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".react-flow");
}

// html-to-image will skip any DOM node this returns false for. We strip UI
// chrome (controls / minimap / attribution / panels / handles) so the export
// only contains the actual board content.
// A 1x1 transparent PNG. Used when a remote image fails CORS or 404s so the
// export doesn't reject on the whole render.
const BLANK_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

function shouldRender(node: HTMLElement): boolean {
  const skip = [
    "react-flow__controls",
    "react-flow__minimap",
    "react-flow__attribution",
    "react-flow__panel",
    "react-flow__handle",
    "react-flow__resize-control",
  ];
  if (skip.some((cls) => node.classList?.contains(cls))) return false;
  // iframes are cross-origin, can't be captured, and often throw during capture.
  if (node.tagName === "IFRAME") return false;
  return true;
}

async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { credentials: "same-origin", mode: "cors" });
  if (!res.ok) throw new Error(`${res.status}`);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Swap every remote <img src> for an inlined data URL BEFORE calling
// html-to-image. This removes the biggest failure surface: html-to-image's
// internal image fetching (which chokes on CORS-blocked hosts and auth
// cookies). Returns a restore fn to put originals back afterwards.
async function inlineImagesIn(root: HTMLElement): Promise<() => void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  const originals: Array<[HTMLImageElement, string]> = [];
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.src;
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;
      try {
        const dataUrl = await fetchAsDataUrl(src);
        originals.push([img, src]);
        img.src = dataUrl;
      } catch {
        originals.push([img, src]);
        img.src = BLANK_PIXEL;
      }
    }),
  );
  return () => {
    for (const [img, src] of originals) img.src = src;
  };
}

async function renderBoard(kind: "png" | "svg"): Promise<string> {
  const el = findFlowElement();
  if (!el) throw new Error("Board not mounted.");

  const restoreImages = await inlineImagesIn(el);

  try {
    const options = {
      backgroundColor: "#0a0a0a",
      cacheBust: true,
      pixelRatio: kind === "png" ? 2 : 1,
      imagePlaceholder: BLANK_PIXEL,
      skipFonts: true,
      fetchRequestInit: { credentials: "same-origin" as const },
      onImageErrorHandler: () => {},
      filter: (node: HTMLElement) => shouldRender(node),
    };

    const dataUrl =
      kind === "png" ? await toPng(el, options) : await toSvg(el, options);
    if (!dataUrl || dataUrl.length < 100) {
      throw new Error("Empty snapshot — the board may still be loading.");
    }
    return dataUrl;
  } finally {
    restoreImages();
  }
}

export async function exportBoardAsPng(projectName: string) {
  const dataUrl = await renderBoard("png");
  download(dataUrl, `${slugify(projectName)}.png`);
}

export async function exportBoardAsSvg(projectName: string) {
  const dataUrl = await renderBoard("svg");
  download(dataUrl, `${slugify(projectName)}.svg`);
}
