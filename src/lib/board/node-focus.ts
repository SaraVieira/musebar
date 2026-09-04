const NODE_SELECTOR = ".react-flow__node";

export function nodeIdFromEventTarget(
	target: EventTarget | null,
): string | null {
	if (!(target instanceof Element)) return null;
	return target.closest(NODE_SELECTOR)?.getAttribute("data-id") ?? null;
}
