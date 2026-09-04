import { createFileRoute, notFound } from "@tanstack/react-router";
import {
	Background,
	type BackgroundVariant,
	Controls,
	ReactFlow,
	ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import { nodeTypes } from "#/components/board/nodes/registry";
import { nodeAriaLabel } from "#/lib/board/node-label";
import { parseSnapshot } from "#/lib/board/snapshot";
import { getPublicProject } from "#/lib/projects-server";

export const Route = createFileRoute("/s/$token")({
	loader: async ({ params }) => {
		const project = await getPublicProject({ data: { token: params.token } });
		if (!project) throw notFound();
		return { project };
	},
	head: ({ loaderData }) => ({
		meta: [
			{
				title: loaderData ? `${loaderData.project.name} · Musebar` : "Musebar",
			},
		],
	}),
	component: PublicBoard,
});

function PublicBoard() {
	const { project } = Route.useLoaderData();
	const { nodes, edges, settings } = useMemo(
		() => parseSnapshot(project.content),
		[project.content],
	);

	const labelled = useMemo(
		() => nodes.map((n) => ({ ...n, ariaLabel: nodeAriaLabel(n) })),
		[nodes],
	);

	return (
		<div className="flex h-screen flex-col">
			<header className="bg-background flex items-baseline gap-3 border-b px-6 py-3">
				<h1 className="truncate text-sm font-medium">{project.name}</h1>
				{project.description ? (
					<p className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
						{project.description}
					</p>
				) : null}
				<span className="text-muted-foreground/70 ml-auto shrink-0 text-xs">
					Read-only
				</span>
			</header>

			<div className="board-readonly min-h-0 flex-1">
				<ReactFlowProvider>
					<ReactFlow
						nodes={labelled}
						edges={edges}
						nodeTypes={nodeTypes}
						nodesDraggable={false}
						nodesConnectable={false}
						elementsSelectable={false}
						edgesFocusable={false}
						fitView={nodes.length > 0}
						minZoom={0.1}
						maxZoom={2.5}
						colorMode="dark"
						aria-label={`${project.name}, read-only board`}
					>
						{settings.bgVariant !== "none" ? (
							<Background
								variant={settings.bgVariant as unknown as BackgroundVariant}
								color={settings.bgColor}
								gap={settings.gridSize}
								size={1}
							/>
						) : null}
						<Controls showInteractive={false} />
					</ReactFlow>
				</ReactFlowProvider>
			</div>
		</div>
	);
}
