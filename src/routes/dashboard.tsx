import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { LogOut } from "lucide-react";
import { auth } from "#/lib/auth";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/pouf/Button";
import {
  NoteCardShapeUtil,
  type NoteCardShape,
} from "#/components/board/note-shape";
import {
  DefaultToolbar,
  DefaultToolbarContent,
  Tldraw,
  TldrawUiMenuItem,
  createShapeId,
  useIsToolSelected,
  useTools,
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

const components: TLComponents = {
  Toolbar(props) {
    const tools = useTools();
    const isSelected = useIsToolSelected(tools["add-note"]);
    return (
      <DefaultToolbar {...props}>
        <TldrawUiMenuItem {...tools["add-note"]} isSelected={isSelected} />
        <DefaultToolbarContent />
      </DefaultToolbar>
    );
  },
};

const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  return auth.api.getSession({ headers: request.headers });
});

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) throw redirect({ href: "/login" });
    return { session };
  },
  component: Dashboard,
});

function Dashboard() {
  const { session } = Route.useRouteContext();
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    await router.invalidate();
    router.navigate({ href: "/login" });
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b">
        <span className="text-sm text-muted">{session.user.email}</span>
        <Button variant="quiet" onClick={signOut}>
          <LogOut aria-hidden />
          Log out
        </Button>
      </header>
      <main className="flex-1 min-h-0">
        <Tldraw
          persistenceKey="test"
          colorScheme="dark"
          shapeUtils={customShapeUtils}
          overrides={uiOverrides}
          components={components}
        />
      </main>
    </div>
  );
}
