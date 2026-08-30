import {
  createFileRoute,
  redirect,
  useRouter,
  Link,
} from "@tanstack/react-router";
import { LogOut, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { authClient } from "#/lib/auth-client";
import { Button } from "#/components/pouf/Button";
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
    if (!confirm("Delete this project?")) return;
    await deleteProject({ data: { id } });
    await router.invalidate();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4 border-b">
        <span className="text-sm text-muted">{session.user.email}</span>
        <Button variant="quiet" onClick={signOut}>
          <LogOut aria-hidden />
          Log out
        </Button>
      </header>
      <main className="p-8 mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Your projects</h1>

        <form onSubmit={onCreate} className="flex gap-2 mb-8">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New project name…"
            className="flex-1 rounded-lg border px-3 py-2 bg-transparent"
          />
          <Button type="submit" loading={busy}>
            <Plus aria-hidden />
            Create
          </Button>
        </form>

        {projects.length === 0 ? (
          <p className="text-muted">
            No projects yet. Create your first board above.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {projects.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <Link
                  to="/projects/$id"
                  params={{ id: p.id }}
                  className="flex-1"
                >
                  <div className="font-medium">{p.name}</div>
                  {p.description ? (
                    <div className="text-sm text-muted">{p.description}</div>
                  ) : null}
                </Link>
                <Button variant="quiet" onClick={() => onDelete(p.id)}>
                  <Trash2 aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
