import {
  AssetRecordType,
  createShapeId,
  createShapesForAssets,
  loadSnapshot,
  Vec,
  type Editor,
} from "tldraw";
import { fetchLinkMetadata } from "../link-metadata-server";
import { useEffect, useRef, useState } from "react";
import { readImageDims, readVideoDims } from "../tldraw";
import { updateProjectContent } from "../projects-server";
import type { FileCardShape } from "#/components/board/file-shape";

const SAVE_DEBOUNCE_MS = 800;

async function uploadFile(file: File, projectId: string) {
  const form = new FormData();
  form.set("file", file);
  form.set("projectId", projectId);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as { id: string; src: string; mimeType: string };
}

function isMediaMime(mime: string) {
  return mime.startsWith("image/") || mime.startsWith("video/");
}

export const useTldraw = ({
  project,
}: {
  project: typeof import("../projects-server").getProject extends (
    ...args: any
  ) => Promise<infer R>
    ? R
    : never;
}) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMount = (editor: Editor) => {
    editor.registerExternalAssetHandler("url", async ({ url }) => {
      const meta = await fetchLinkMetadata({ data: { url } });
      return {
        id: AssetRecordType.createId(),
        typeName: "asset",
        type: "bookmark",
        props: {
          src: url,
          title: meta.title,
          description: meta.description,
          image: meta.image,
          favicon: meta.favicon,
        },
        meta: {},
      };
    });

    editor.registerExternalAssetHandler("file", async ({ file }) => {
      const { src, mimeType } = await uploadFile(file, project.id);

      if (mimeType.startsWith("image/")) {
        const { w, h } = await readImageDims(file);
        return {
          id: AssetRecordType.createId(),
          typeName: "asset",
          type: "image",
          props: {
            name: file.name,
            src,
            w,
            h,
            mimeType,
            isAnimated: mimeType === "image/gif" || mimeType === "image/webp",
            fileSize: file.size,
          },
          meta: {},
        };
      }

      if (mimeType.startsWith("video/")) {
        const { w, h } = await readVideoDims(file);
        return {
          id: AssetRecordType.createId(),
          typeName: "asset",
          type: "video",
          props: {
            name: file.name,
            src,
            w,
            h,
            mimeType,
            isAnimated: true,
            fileSize: file.size,
          },
          meta: {},
        };
      }

      throw new Error(`Non-media handled elsewhere: ${mimeType}`);
    });

    editor.registerExternalContentHandler("files", async ({ files, point }) => {
      const center =
        point ??
        (editor.inputs.getShiftKey()
          ? editor.inputs.getCurrentPagePoint()
          : editor.getViewportPageBounds().center);

      const media: File[] = [];
      const other: File[] = [];
      for (const file of files) {
        (isMediaMime(file.type) ? media : other).push(file);
      }

      if (media.length > 0) {
        const assets = await Promise.all(
          media.map((file) =>
            editor.getAssetForExternalContent({ type: "file", file }),
          ),
        );
        const validAssets = assets.filter((a): a is NonNullable<typeof a> =>
          Boolean(a),
        );
        if (validAssets.length > 0) {
          editor.createAssets(validAssets);
          await createShapesForAssets(editor, validAssets, center);
        }
      }

      other.forEach((file, i) => {
        placeFileCard(editor, file, project.id, center, i);
      });
    });

    setEditor(editor);
  };

  useEffect(() => {
    if (!editor) return;

    if (project.content) {
      try {
        loadSnapshot(editor.store, JSON.parse(project.content));
      } catch {
        // Bad snapshot — start blank rather than crash.
      }
    }

    const unsubscribe = editor.store.listen(
      () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
          const snapshot = editor.store.getStoreSnapshot();
          await updateProjectContent({
            data: { id: project.id, content: JSON.stringify(snapshot) },
          });
        }, SAVE_DEBOUNCE_MS);
      },
      { source: "user", scope: "document" },
    );

    return () => {
      unsubscribe();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [editor, project.id, project.content]);

  return {
    onMount,
    editor,
  };
};

async function placeFileCard(
  editor: Editor,
  file: File,
  projectId: string,
  center: { x: number; y: number },
  offsetIndex: number,
) {
  const w = 240;
  const h = 96;
  const id = createShapeId();
  const offset = new Vec(offsetIndex * 16, offsetIndex * 16);

  editor.createShape<FileCardShape>({
    id,
    type: "file-card",
    x: center.x - w / 2 + offset.x,
    y: center.y - h / 2 + offset.y,
    props: {
      w,
      h,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      src: "",
    },
  });

  try {
    const { src } = await uploadFile(file, projectId);
    editor.updateShape<FileCardShape>({
      id,
      type: "file-card",
      props: { src },
    });
  } catch (err) {
    editor.deleteShape(id);
    console.error("[file-card] upload failed", err);
  }
}
