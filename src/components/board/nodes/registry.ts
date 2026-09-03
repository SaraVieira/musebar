import type { NodeTypes } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";
import { Frame, ListChecks, StickyNote, Type } from "lucide-react";
import type { CreatableNodeType } from "#/lib/board/node-types";
import { BookmarkNodeView } from "./bookmark-node";
import { EmbedNodeView } from "./embed-node";
import { FileNodeView } from "./file-node";
import { FrameNodeView } from "./frame-node";
import { ImageNodeView } from "./image-node";
import { MapNodeView } from "./map-node";
import { ModelNodeView } from "./model-node";
import { NoteNodeView } from "./note";
import { PdfNodeView } from "./pdf-node";
import { TextNodeView } from "./text-node";
import { TodoNodeView } from "./todo-node";

export const nodeTypes: NodeTypes = {
	note: NoteNodeView,
	todo: TodoNodeView,
	text: TextNodeView,
	frame: FrameNodeView,
	file: FileNodeView,
	image: ImageNodeView,
	bookmark: BookmarkNodeView,
	embed: EmbedNodeView,
	map: MapNodeView,
	model: ModelNodeView,
	pdf: PdfNodeView,
};

export const CREATABLE_NODE_ICONS: Record<CreatableNodeType, LucideIcon> = {
	note: StickyNote,
	todo: ListChecks,
	text: Type,
	frame: Frame,
};
