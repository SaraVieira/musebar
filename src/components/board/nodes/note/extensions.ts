import type { JSONContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";

export const NOTE_EXTENSIONS = [
	StarterKit.configure({
		heading: { levels: [2, 3] },
		horizontalRule: false,
		codeBlock: false,
		blockquote: false,
	}),
];

export const EMPTY_NOTE_DOC: JSONContent = {
	type: "doc",
	content: [{ type: "paragraph" }],
};
