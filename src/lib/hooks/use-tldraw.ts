import { AssetRecordType, loadSnapshot, type Editor } from "tldraw";
import { fetchLinkMetadata } from "../link-metadata-server";
import { useEffect, useRef, useState } from "react";
import { readImageDims, readVideoDims } from "../tldraw";
import { updateProjectContent } from "../projects-server";

const SAVE_DEBOUNCE_MS = 800;

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
      const form = new FormData();
      form.set("file", file);
      form.set("projectId", project.id);
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
      }
      const { src, mimeType } = (await res.json()) as {
        src: string;
        mimeType: string;
      };

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

      throw new Error(`Unsupported file type: ${mimeType}`);
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
