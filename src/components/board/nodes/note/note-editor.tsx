import type { JSONContent } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import { NOTE_EXTENSIONS } from "./extensions";
import { NoteToolbar } from "./note-toolbar";

export function NoteEditor({
	initialContent,
	onChange,
	onBlur,
}: {
	initialContent: JSONContent;
	onChange: (c: JSONContent) => void;
	onBlur: () => void;
}) {
	const editor = useEditor({
		extensions: NOTE_EXTENSIONS,
		content: initialContent,
		autofocus: "end",
		onUpdate({ editor }) {
			onChange(editor.getJSON());
		},
		onBlur() {
			onBlur();
		},
		editorProps: {
			attributes: { class: "note-card-content note-card-editor" },
		},
	});

	if (!editor) return null;

	return (
		// Not a control: this wrapper only stops canvas drag/key handlers from
		// swallowing events meant for the editor inside it.
		// biome-ignore lint/a11y/noStaticElementInteractions: event firewall, not an interactive element
		<div
			onPointerDown={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.stopPropagation()}
			className="h-full"
		>
			<NoteToolbar editor={editor} />
			<EditorContent editor={editor} />
		</div>
	);
}
