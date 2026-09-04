import { describe, expect, it } from "vitest";
import { referencedAssetIds } from "./assets";

describe("referencedAssetIds", () => {
	it("returns nothing for empty content", () => {
		expect(referencedAssetIds(null).size).toBe(0);
		expect(referencedAssetIds("").size).toBe(0);
		expect(referencedAssetIds("{}").size).toBe(0);
	});

	it("finds ids in serialised node data", () => {
		const content = JSON.stringify({
			nodes: [
				{
					id: "a",
					data: { src: "/api/assets/11111111-1111-4111-8111-111111111111" },
				},
				{
					id: "b",
					data: { src: "/api/assets/22222222-2222-4222-8222-222222222222" },
				},
			],
		});
		expect([...referencedAssetIds(content)]).toEqual([
			"11111111-1111-4111-8111-111111111111",
			"22222222-2222-4222-8222-222222222222",
		]);
	});

	it("counts a repeated reference once", () => {
		const id = "33333333-3333-4333-8333-333333333333";
		const content = `/api/assets/${id} and again /api/assets/${id}`;
		expect(referencedAssetIds(content).size).toBe(1);
	});

	it("finds ids wherever they appear, not just in a known field", () => {
		const content = JSON.stringify({
			nodes: [
				{
					id: "pdf",
					data: {
						src: "/api/assets/aaa",
						thumbnail: "/api/assets/bbb",
						nested: { deep: "/api/assets/ccc" },
					},
				},
			],
		});
		expect([...referencedAssetIds(content)].sort()).toEqual([
			"aaa",
			"bbb",
			"ccc",
		]);
	});

	it("ignores urls that are not asset routes", () => {
		const content =
			"/api/uploads /api/assetsx/abc https://example.com/api/asset/9";
		expect(referencedAssetIds(content).size).toBe(0);
	});

	it("still matches an absolute asset url", () => {
		expect([...referencedAssetIds("https://host/api/assets/xyz")]).toEqual([
			"xyz",
		]);
	});
});
