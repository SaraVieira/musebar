/** Class React Flow puts on the focusable wrapper around every node. */
const NODE_SELECTOR = ".react-flow__node";

/**
 * The id of the node a keyboard event came from, or null if the event did not
 * originate inside one.
 *
 * Keyboard focus sits on React Flow's node wrapper, not on the node view's own
 * markup, so board-level handlers have to walk back up from the event target.
 */
export function nodeIdFromEventTarget(
	target: EventTarget | null,
): string | null {
	if (!(target instanceof Element)) return null;
	return target.closest(NODE_SELECTOR)?.getAttribute("data-id") ?? null;
}
