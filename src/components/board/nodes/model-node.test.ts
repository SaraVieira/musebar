import { describe, expect, it } from "vitest";
import { detectModelFormat } from "./model-node";

describe("detectModelFormat", () => {
	it("recognises every supported extension", () => {
		for (const ext of ["gltf", "glb", "stl", "obj", "3mf"]) {
			expect(detectModelFormat(`model.${ext}`)).toBe(ext);
		}
	});

	it("is case-insensitive", () => {
		expect(detectModelFormat("Model.GLB")).toBe("glb");
	});

	it("uses the last extension on multi-dotted names", () => {
		expect(detectModelFormat("my.model.v2.stl")).toBe("stl");
	});

	it("returns null for unsupported or missing extensions", () => {
		expect(detectModelFormat("photo.png")).toBeNull();
		expect(detectModelFormat("README")).toBe(null);
		expect(detectModelFormat("")).toBeNull();
	});
});
