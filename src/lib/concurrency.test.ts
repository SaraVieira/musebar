import { describe, expect, it, vi } from "vitest";
import { mapWithConcurrency } from "./concurrency";

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("mapWithConcurrency", () => {
	it("returns results in input order regardless of completion order", async () => {
		const items = [30, 10, 20, 0];
		const out = await mapWithConcurrency(items, 4, async (ms) => {
			await new Promise((r) => setTimeout(r, ms));
			return ms;
		});
		expect(out).toEqual(items);
	});

	it("never exceeds the limit", async () => {
		let inFlight = 0;
		let peak = 0;
		await mapWithConcurrency(
			Array.from({ length: 20 }, (_, i) => i),
			4,
			async () => {
				inFlight++;
				peak = Math.max(peak, inFlight);
				await tick();
				inFlight--;
			},
		);
		expect(peak).toBe(4);
	});

	it("still runs everything when the limit exceeds the item count", async () => {
		let peak = 0;
		let inFlight = 0;
		const out = await mapWithConcurrency([1, 2], 10, async (n) => {
			inFlight++;
			peak = Math.max(peak, inFlight);
			await tick();
			inFlight--;
			return n * 2;
		});
		expect(out).toEqual([2, 4]);
		expect(peak).toBe(2);
	});

	it("runs serially when the limit is one", async () => {
		let inFlight = 0;
		let peak = 0;
		await mapWithConcurrency([1, 2, 3], 1, async () => {
			inFlight++;
			peak = Math.max(peak, inFlight);
			await tick();
			inFlight--;
		});
		expect(peak).toBe(1);
	});

	it("treats a zero or negative limit as one rather than stalling", async () => {
		const out = await mapWithConcurrency([1, 2], 0, async (n) => n);
		expect(out).toEqual([1, 2]);
	});

	it("passes the index through", async () => {
		const fn = vi.fn(async (item: string, index: number) => `${index}:${item}`);
		expect(await mapWithConcurrency(["a", "b"], 2, fn)).toEqual(["0:a", "1:b"]);
	});

	it("handles an empty list", async () => {
		expect(await mapWithConcurrency([], 4, async () => 1)).toEqual([]);
	});

	it("rejects if a task rejects", async () => {
		await expect(
			mapWithConcurrency([1, 2], 2, async (n) => {
				if (n === 2) throw new Error("boom");
				return n;
			}),
		).rejects.toThrow("boom");
	});
});
