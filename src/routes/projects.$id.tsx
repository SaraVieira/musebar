import {
  createFileRoute,
  notFound,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "#/components/pouf/Button";
import { getSession } from "#/lib/auth-server";
import { getProject, updateProjectContent } from "#/lib/projects-server";
import { fetchLinkMetadata } from "#/lib/link-metadata-server";
import { AssetRecordType } from "@tldraw/tlschema";
import {
  NoteCardShapeUtil,
  type NoteCardShape,
} from "#/components/board/note-shape";
import {
  DefaultToolbar,
  Tldraw,
  TldrawUiMenuItem,
  createShapeId,
  loadSnapshot,
  useIsToolSelected,
  useTools,
  type Editor,
  type TLComponents,
  type TLUiOverrides,
} from "tldraw";
import "tldraw/tldraw.css";

const customShapeUtils = [NoteCardShapeUtil];

const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    tools["add-note"] = {
      id: "add-note",
      icon: "geo-rectangle",
      label: "Add note",
      kbd: "n",
      onSelect() {
        const { x, y } = editor.getViewportPageBounds().center;
        editor.createShape<NoteCardShape>({
          id: createShapeId(),
          type: "note-card",
          x: x - 120,
          y: y - 80,
        });
      },
    };
    return tools;
  },
};

const KEEP_TOOLS = [
  "select",
  "hand",
  "add-note",
  "arrow",
  "text",
  "frame",
] as const;

const components: TLComponents = {
  Toolbar(props) {
    const tools = useTools();
    return (
      <DefaultToolbar {...props}>
        {KEEP_TOOLS.map((id) => {
          const tool = tools[id];
          if (!tool) return null;
          return <ToolbarItem key={id} tool={tool} />;
        })}
      </DefaultToolbar>
    );
  },
  ActionsMenu: null,
  QuickActions: null,
  StylePanel: null,
};

function ToolbarItem({ tool }: { tool: ReturnType<typeof useTools>[string] }) {
  const isSelected = useIsToolSelected(tool);
  return <TldrawUiMenuItem {...tool} isSelected={isSelected} />;
}

export const Route = createFileRoute("/projects/$id")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) throw redirect({ href: "/login" });
  },
  loader: async ({ params }) => {
    const project = await getProject({ data: { id: params.id } });
    if (!project) throw notFound();
    return { project };
  },
  component: Board,
});

const SAVE_DEBOUNCE_MS = 800;

function Board() {
  const { project } = Route.useLoaderData();
  const router = useRouter();
  const [editor, setEditor] = useState<Editor | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-3 p-4 border-b">
        <Button
          variant="quiet"
          onClick={() => router.navigate({ href: "/dashboard" })}
        >
          <ArrowLeft aria-hidden />
          Back
        </Button>
        <h1 className="text-lg font-medium">{project.name}</h1>
      </header>
      <main className="flex-1 min-h-0">
        <Tldraw
          colorScheme="dark"
          shapeUtils={customShapeUtils}
          overrides={uiOverrides}
          components={components}
          onMount={(editor) => {
            editor.registerExternalAssetHandler("url", async ({ url }) => {
              const meta = await fetchLinkMetadata({ data: { url } });
              console.log("[bookmark] scraped", url, meta);
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
            setEditor(editor);
          }}
        />
      </main>
    </div>
  );
}
