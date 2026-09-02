import {
	Frame,
	Image as ImageIcon,
	Link2,
	ListChecks,
	Paperclip,
	StickyNote,
	Type,
} from "lucide-react";
import { type ReactNode, useRef } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { cn } from "#/lib/utils";

interface SidebarButtonProps {
	icon: ReactNode;
	label: string;
	onClick: () => void;
}

function SidebarButton({ icon, label, onClick }: SidebarButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger
				onClick={onClick}
				aria-label={label}
				className={cn(
					"hover:bg-accent hover:text-accent-foreground text-muted-foreground",
					"flex size-12 items-center justify-center rounded-md",
					"transition-colors focus:outline-none focus-visible:ring-ring focus-visible:ring-2",
				)}
			>
				{icon}
			</TooltipTrigger>
			<TooltipContent side="right">{label}</TooltipContent>
		</Tooltip>
	);
}

export function BoardSidebar({
	onAddNote,
	onAddTodo,
	onAddText,
	onAddFrame,
	onAddUrl,
	onAddFiles,
}: {
	onAddNote: () => void;
	onAddTodo: () => void;
	onAddText: () => void;
	onAddFrame: () => void;
	onAddUrl: () => void;
	onAddFiles: (files: File[]) => void;
}) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);

	return (
		<TooltipProvider delay={150}>
			<aside className="bg-background flex w-14 shrink-0 flex-col items-center gap-1 border-r py-3">
				<SidebarButton
					icon={<StickyNote className="size-5" />}
					label="Note"
					onClick={onAddNote}
				/>
				<SidebarButton
					icon={<ListChecks className="size-5" />}
					label="Todo list"
					onClick={onAddTodo}
				/>
				<SidebarButton
					icon={<Type className="size-5" />}
					label="Text"
					onClick={onAddText}
				/>
				<SidebarButton
					icon={<Frame className="size-5" />}
					label="Frame"
					onClick={onAddFrame}
				/>
				<div className="bg-border my-1 h-px w-6" />
				<SidebarButton
					icon={<Link2 className="size-5" />}
					label="Add link"
					onClick={onAddUrl}
				/>
				<SidebarButton
					icon={<ImageIcon className="size-5" />}
					label="Add image"
					onClick={() => imageInputRef.current?.click()}
				/>
				<SidebarButton
					icon={<Paperclip className="size-5" />}
					label="Add file"
					onClick={() => fileInputRef.current?.click()}
				/>
				<input
					ref={imageInputRef}
					type="file"
					accept="image/*"
					multiple
					className="hidden"
					onChange={(e) => {
						const files = Array.from(e.target.files ?? []);
						e.target.value = "";
						if (files.length > 0) onAddFiles(files);
					}}
				/>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					className="hidden"
					onChange={(e) => {
						const files = Array.from(e.target.files ?? []);
						e.target.value = "";
						if (files.length > 0) onAddFiles(files);
					}}
				/>
			</aside>
		</TooltipProvider>
	);
}
