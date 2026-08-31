import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { LogOut, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { getSession } from "#/lib/auth-server";
import {
  createProject,
  deleteProject,
  listProjects,
} from "#/lib/projects-server";
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
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);

  async function signOut() {
    await authClient.signOut();
    await router.invalidate();
    router.navigate({ href: "/login" });
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const { id } = await createProject({ data: { name: name.trim() } });
      setName("");
      await router.invalidate();
      router.navigate({ href: `/projects/${id}` });
    } catch (err) {
      toast.error("Couldn't create the project", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
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
          <form onSubmit={onCreate} className="flex w-full max-w-sm gap-2">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New project name…"
              className="flex-1"
            />
            <Button type="submit" disabled={busy || !name.trim()}>
              <Plus aria-hidden />
              Create
            </Button>
          </form>
        </div>

        {projects.length === 0 ? (
          <div className="border-border/60 bg-card/40 rounded-xl border border-dashed py-20 text-center">
            <p className="text-muted-foreground text-sm">
              No projects yet. Create your first board above.
            </p>
          </div>
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
