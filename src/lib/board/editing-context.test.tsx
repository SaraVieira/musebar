// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BoardEditingProvider, useNodeEditing } from "./editing-context";

function NodeProbe({ id }: { id: string }) {
	const { isEditing, startEditing, stopEditing } = useNodeEditing(id);
	return (
		<div>
			<span data-testid={`state-${id}`}>{isEditing ? "editing" : "idle"}</span>
			<button type="button" data-testid={`start-${id}`} onClick={startEditing}>
				start
			</button>
			<button type="button" data-testid={`stop-${id}`} onClick={stopEditing}>
				stop
			</button>
		</div>
	);
}

function setup() {
	return render(
		<BoardEditingProvider>
			<NodeProbe id="a" />
			<NodeProbe id="b" />
		</BoardEditingProvider>,
	);
}

// vitest is not running with globals, so RTL's auto-cleanup is not installed.
afterEach(cleanup);

const state = (id: string) => screen.getByTestId(`state-${id}`).textContent;
const click = (testId: string) =>
	act(() => {
		screen.getByTestId(testId).click();
	});

describe("board editing context", () => {
	it("starts with nothing being edited", () => {
		setup();
		expect(state("a")).toBe("idle");
		expect(state("b")).toBe("idle");
	});

	it("puts only the requested node into edit mode", () => {
		setup();
		click("start-a");
		expect(state("a")).toBe("editing");
		expect(state("b")).toBe("idle");
	});

	it("only ever edits one node at a time", () => {
		setup();
		click("start-a");
		click("start-b");
		expect(state("a")).toBe("idle");
		expect(state("b")).toBe("editing");
	});

	it("stops editing", () => {
		setup();
		click("start-a");
		click("stop-a");
		expect(state("a")).toBe("idle");
	});

	it("lets any node stop the current edit", () => {
		setup();
		click("start-a");
		click("stop-b");
		expect(state("a")).toBe("idle");
	});
});
