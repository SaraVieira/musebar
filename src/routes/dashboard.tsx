import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { LogOut, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import { getSession } from "#/lib/auth-server";
import { deleteProject, listProjects } from "#/lib/projects-server";
import { CreateProjectDialog } from "#/components/dashboard/create-project-dialog";
import { EditProjectDialog } from "#/components/dashboard/edit-project-dialog";
import { ProjectCard } from "#/components/dashboard/project-card";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) throw redirect({ href: "/login" });
    return { session };
  },
  loader: async () => ({ projects: await listProjects() }),
  component: Dashboard,
});

export type ProjectRow = ReturnType<
  typeof Route.useLoaderData
>["projects"][number];

function Dashboard() {
  const { session } = Route.useRouteContext();
  const { projects } = Route.useLoaderData();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);

  async function signOut() {
    await authClient.signOut();
    await router.invalidate();
    router.navigate({ href: "/login" });
  }

  async function onDelete(id: string, name: string) {
    try {
      await deleteProject({ data: { id } });
      await router.invalidate();
      toast.success(`Deleted "${name}"`);
    } catch (err) {
      toast.error("Couldn't delete the project", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="bg-background flex items-center justify-between border-b px-6 py-3">
        <span className="text-muted-foreground text-sm">
          {session.user.email}
        </span>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut aria-hidden />
          Log out
        </Button>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Your projects
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {projects.length === 0
                ? "Start by creating your first board."
                : `${projects.length} ${projects.length === 1 ? "board" : "boards"}`}
            </p>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            New project
          </Button>
        </div>

        {projects.length === 0 ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="border-border/60 hover:border-border hover:bg-card/60 bg-card/40 focus-visible:ring-ring block w-full rounded-xl border border-dashed py-20 text-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Plus
              aria-hidden
              className="text-muted-foreground mx-auto h-8 w-8"
            />
            <p className="text-muted-foreground mt-2 text-sm">
              Create your first board
            </p>
          </button>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onEdit={() => setEditing(p)}
                onDelete={() => onDelete(p.id, p.name)}
              />
            ))}
          </ul>
        )}
      </main>
      <CreateProjectDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={async (id) => {
          await router.invalidate();
          router.navigate({ href: `/projects/${id}` });
        }}
      />
      <EditProjectDialog
        project={editing}
        open={editing !== null}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
        onSaved={async () => {
          await router.invalidate();
          toast.success("Project updated");
        }}
      />
    </div>
  );
}
