import {
  createFileRoute,
  redirect,
  useRouter,
  Link,
} from "@tanstack/react-router";
import { LogOut, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { getSession } from "#/lib/auth-server";
import {
  createProject,
  deleteProject,
  listProjects,
} from "#/lib/projects-server";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) throw redirect({ href: "/login" });
    return { session };
  },
  loader: async () => ({ projects: await listProjects() }),
  component: Dashboard,
});

function Dashboard() {
  const { session } = Route.useRouteContext();
  const { projects } = Route.useLoaderData();
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

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
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    await deleteProject({ data: { id } });
    await router.invalidate();
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

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">
          Your projects
        </h1>

        <form onSubmit={onCreate} className="mb-8 flex gap-2">
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

        {projects.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-12 text-center text-sm">
              No projects yet. Create your first board above.
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Card className="hover:bg-accent/40 transition-colors">
                  <CardContent className="flex items-center gap-2 p-4">
                    <Link
                      to="/projects/$id"
                      params={{ id: p.id }}
                      className="min-w-0 flex-1"
                    >
                      <div className="truncate font-medium">{p.name}</div>
                      {p.description ? (
                        <div className="text-muted-foreground truncate text-sm">
                          {p.description}
                        </div>
                      ) : null}
                    </Link>
                    <DeleteProjectButton
                      name={p.name}
                      onConfirm={() => onDelete(p.id)}
                    />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function DeleteProjectButton({
  name,
  onConfirm,
}: {
  name: string;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${name}`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 aria-hidden />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{name}</strong> and all of its notes, files, and boards will
            be permanently deleted. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
