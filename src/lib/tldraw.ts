import type { TLAssetStore } from "tldraw";

const blobUrlCache = new Map<string, Promise<string>>();

async function fetchAsBlobUrl(url: string) {
  const cached = blobUrlCache.get(url);
  if (cached) return cached;
  const promise = fetch(url, { credentials: "same-origin" }).then(async (res) => {
    if (!res.ok) {
      blobUrlCache.delete(url);
      throw new Error(`Failed to fetch asset ${url}: ${res.status}`);
    }
    return URL.createObjectURL(await res.blob());
  });
  blobUrlCache.set(url, promise);
  return promise;
}

export function revokeCachedBlobUrl(url: string) {
  const cached = blobUrlCache.get(url);
  if (!cached) return;
  blobUrlCache.delete(url);
  cached.then(URL.revokeObjectURL, () => {});
}

export const musebarAssetStore: TLAssetStore = {
  async upload() {
    throw new Error("Uploads go through registerExternalAssetHandler");
  },
  async resolve(asset) {
    const src = "src" in asset.props ? asset.props.src : null;
    if (!src) return null;
    if (src.startsWith("data:") || src.startsWith("blob:")) return src;
    if (src.startsWith("/api/assets/")) return fetchAsBlobUrl(src);
    return src;
  },
};

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

export function readVideoDims(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve({ w: video.videoWidth, h: video.videoHeight });
      URL.revokeObjectURL(url);
    };
    video.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    video.src = url;
  });
}
