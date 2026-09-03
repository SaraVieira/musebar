// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { nodeIdFromEventTarget } from "./node-focus";

function mountNode(id: string) {
	const wrapper = document.createElement("div");
	wrapper.className = "react-flow__node react-flow__node-note";
	wrapper.setAttribute("data-id", id);
	const inner = document.createElement("div");
	wrapper.appendChild(inner);
	document.body.appendChild(wrapper);
	return { wrapper, inner };
}

afterEach(() => {
	document.body.innerHTML = "";
});

describe("nodeIdFromEventTarget", () => {
	it("reads the id off the node wrapper itself", () => {
		const { wrapper } = mountNode("node-1");
		expect(nodeIdFromEventTarget(wrapper)).toBe("node-1");
	});

	it("walks up from a descendant, which is where events actually originate", () => {
		const { inner } = mountNode("node-1");
		expect(nodeIdFromEventTarget(inner)).toBe("node-1");
	});

	it("returns null outside any node", () => {
		mountNode("node-1");
		const outside = document.createElement("div");
		document.body.appendChild(outside);
		expect(nodeIdFromEventTarget(outside)).toBeNull();
	});

	it("returns null for a non-element target", () => {
		expect(nodeIdFromEventTarget(null)).toBeNull();
		expect(nodeIdFromEventTarget(document)).toBeNull();
		expect(nodeIdFromEventTarget(window)).toBeNull();
	});

	it("picks the nearest node when nodes are nested, as in a frame", () => {
		const { wrapper: outer } = mountNode("frame-1");
		const innerWrapper = document.createElement("div");
		innerWrapper.className = "react-flow__node";
		innerWrapper.setAttribute("data-id", "child-1");
		const leaf = document.createElement("span");
		innerWrapper.appendChild(leaf);
		outer.appendChild(innerWrapper);
		expect(nodeIdFromEventTarget(leaf)).toBe("child-1");
	});

	it("returns null when the wrapper has no data-id", () => {
		const wrapper = document.createElement("div");
		wrapper.className = "react-flow__node";
		document.body.appendChild(wrapper);
		expect(nodeIdFromEventTarget(wrapper)).toBeNull();
	});
});
