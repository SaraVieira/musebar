// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CREATABLE_NODES } from "#/lib/board/node-types";
import { useBoardShortcuts } from "./use-board-shortcuts";

function press(key: string, init: KeyboardEventInit = {}) {
	window.dispatchEvent(new KeyboardEvent("keydown", { key, ...init }));
}

type ListenerSpy = { mock: { calls: unknown[][] } };

let addSpy: ListenerSpy;
let removeSpy: ListenerSpy;

beforeEach(() => {
	addSpy = vi.spyOn(window, "addEventListener");
	removeSpy = vi.spyOn(window, "removeEventListener");
});
afterEach(() => vi.restoreAllMocks());

function handlers() {
	return {
		onAddNode: vi.fn(),
		onDuplicate: vi.fn(),
		onOpenShortcuts: vi.fn(),
	};
}

/** Fresh object literal each render, exactly as the board passes it. */
function setup(h: ReturnType<typeof handlers>) {
	return renderHook(() =>
		useBoardShortcuts({
			onAddNode: h.onAddNode,
			onDuplicate: h.onDuplicate,
			onOpenShortcuts: h.onOpenShortcuts,
		}),
	);
}

const keydownCalls = (spy: ListenerSpy) =>
	spy.mock.calls.filter((call) => call[0] === "keydown").length;

describe("useBoardShortcuts", () => {
	it("binds the keydown listener once, not on every render", () => {
		const { rerender } = setup(handlers());
		expect(keydownCalls(addSpy)).toBe(1);

		for (let i = 0; i < 5; i++) rerender();

		expect(keydownCalls(addSpy)).toBe(1);
		expect(keydownCalls(removeSpy)).toBe(0);
	});

	it("removes the listener on unmount", () => {
		const { unmount } = setup(handlers());
		unmount();
		expect(keydownCalls(removeSpy)).toBe(1);
	});

	it("still calls the latest handlers after a re-render", () => {
		const first = handlers();
		const { rerender } = setup(first);
		rerender();
		press("n");
		expect(first.onAddNode).toHaveBeenCalledWith("note");
	});

	it("maps every creatable shortcut to its node type", () => {
		const h = handlers();
		setup(h);
		for (const { type, shortcut } of CREATABLE_NODES) {
			h.onAddNode.mockClear();
			press(shortcut);
			expect(h.onAddNode).toHaveBeenCalledWith(type);
		}
	});

	it("ignores shortcuts while the user is typing", () => {
		const h = handlers();
		setup(h);
		const input = document.createElement("input");
		document.body.appendChild(input);
		input.dispatchEvent(
			new KeyboardEvent("keydown", { key: "n", bubbles: true }),
		);
		expect(h.onAddNode).not.toHaveBeenCalled();
		input.remove();
	});

	it("handles the meta shortcuts", () => {
		const h = handlers();
		setup(h);
		press("d", { metaKey: true });
		expect(h.onDuplicate).toHaveBeenCalledTimes(1);
		press("/", { metaKey: true });
		expect(h.onOpenShortcuts).toHaveBeenCalledTimes(1);
		press("?");
		expect(h.onOpenShortcuts).toHaveBeenCalledTimes(2);
	});

	it("does not create nodes when a modifier is held", () => {
		const h = handlers();
		setup(h);
		press("n", { metaKey: true });
		press("n", { altKey: true });
		expect(h.onAddNode).not.toHaveBeenCalled();
	});
});
