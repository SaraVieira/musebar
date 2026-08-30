import {
  createFileRoute,
  notFound,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "#/components/pouf/Button";
import { getSession } from "#/lib/auth-server";
import { getProject } from "#/lib/projects-server";
import {
  NoteCardShapeUtil,
  type NoteCardShape,
} from "#/components/board/note-shape";
import {
  DefaultToolbar,
  Tldraw,
  TldrawUiMenuItem,
  createShapeId,
  useIsToolSelected,
  useTools,
  type TLComponents,
  type TLUiOverrides,
} from "tldraw";
import "tldraw/tldraw.css";
import { useTldraw } from "#/lib/hooks/use-tldraw";
import { musebarAssetStore } from "#/lib/tldraw";

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

function Board() {
  const { project } = Route.useLoaderData();
  const router = useRouter();
  const { onMount } = useTldraw({ project });

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
          assets={musebarAssetStore}
          onMount={onMount}
        />
      </main>
    </div>
  );
}
