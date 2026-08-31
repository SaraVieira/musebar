import { Link } from "@tanstack/react-router";
import { ThumbnailPreview } from "./thumbnail-preview";
import { Button } from "../ui/button";
import { Pencil } from "lucide-react";
import { DeleteProject } from "./delete-project";
import { RELATIVE_UNITS } from "#/lib/constants";
import type { Route } from "#/routes/dashboard";

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

function formatRelative(date: Date | null): string {
  if (!date) return "";
  const diff = (date.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  for (const [unit, secs] of RELATIVE_UNITS) {
    if (abs >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return rtf.format(Math.round(diff), "second");
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: ReturnType<typeof Route.useLoaderData>["projects"][number];
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
}) {
  return (
    <li className="group relative">
      <Link
        to="/projects/$id"
        params={{ id: project.id }}
        className="bg-card hover:ring-foreground/20 block overflow-hidden rounded-xl ring-transparent ring-0 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 hover:outline-none"
      >
        <ThumbnailPreview svg={project.thumbnail} />
        <div className="p-4">
          <div className="truncate text-base font-medium">{project.name}</div>
          {project.description ? (
            <div className="text-muted-foreground mt-1 line-clamp-1 text-sm">
              {project.description}
            </div>
          ) : null}
          <div className="text-muted-foreground/80 mt-2 text-xs">
            {project.updatedAt
              ? `Updated ${formatRelative(new Date(project.updatedAt))}`
              : "Never edited"}
          </div>
        </div>
      </Link>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="secondary"
          size="icon"
          aria-label={`Edit ${project.name}`}
          className="h-8 w-8 shadow-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil aria-hidden className="h-3.5 w-3.5" />
        </Button>
        <DeleteProject name={project.name} onConfirm={onDelete} />
      </div>
    </li>
  );
}
