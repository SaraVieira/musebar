// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type SaveResult, useAutosave } from "./use-autosave";

const DELAY = 800;

/** A save fn that resolves immediately, bumping the version each call. */
function okSave() {
	return vi.fn(
		async (_data: unknown, version: number): Promise<SaveResult> => ({
			conflict: false,
			version: version + 1,
		}),
	);
}

/** A save fn whose resolution the test controls. */
function deferredSave() {
	const calls: Array<(r: SaveResult) => void> = [];
	const fn = vi.fn(
		(_data: unknown, _version: number) =>
			new Promise<SaveResult>((resolve) => {
				calls.push(resolve);
			}),
	);
	return { fn, resolve: (i: number, r: SaveResult) => calls[i](r) };
}

function setup(save: ReturnType<typeof okSave>, extra = {}) {
	return renderHook(
		({ data }: { data: object }) =>
			useAutosave({
				data,
				initialVersion: 3,
				save,
				delayMs: DELAY,
				...extra,
			}),
		{ initialProps: { data: { v: 0 } } },
	);
}

async function advance(ms: number) {
	await act(async () => {
		vi.advanceTimersByTime(ms);
	});
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useAutosave", () => {
	it("does not save on mount", async () => {
		const save = okSave();
		setup(save);
		await advance(DELAY * 2);
		expect(save).not.toHaveBeenCalled();
	});

	it("saves once after the debounce delay", async () => {
		const save = okSave();
		const { rerender } = setup(save);
		rerender({ data: { v: 1 } });
		await advance(DELAY - 1);
		expect(save).not.toHaveBeenCalled();
		await advance(1);
		expect(save).toHaveBeenCalledTimes(1);
	});

	it("coalesces rapid edits into a single save", async () => {
		const save = okSave();
		const { rerender } = setup(save);
		for (let v = 1; v <= 5; v++) {
			rerender({ data: { v } });
			await advance(DELAY / 4);
		}
		await advance(DELAY);
		expect(save).toHaveBeenCalledTimes(1);
		expect(save.mock.calls[0][0]).toEqual({ v: 5 });
	});

	it("sends the loaded version first, then the version the server returned", async () => {
		const save = okSave();
		const { rerender } = setup(save);
		rerender({ data: { v: 1 } });
		await advance(DELAY);
		expect(save.mock.calls[0][1]).toBe(3);

		rerender({ data: { v: 2 } });
		await advance(DELAY);
		expect(save.mock.calls[1][1]).toBe(4);
	});

	it("reports status through the save lifecycle", async () => {
		const save = okSave();
		const { result, rerender } = setup(save);
		expect(result.current.status).toBe("idle");
		rerender({ data: { v: 1 } });
		expect(result.current.status).toBe("pending");
		await advance(DELAY);
		expect(result.current.status).toBe("saved");
	});

	describe("no overlapping writes", () => {
		it("does not start a second save while one is in flight", async () => {
			const { fn, resolve } = deferredSave();
			const { rerender } = setup(fn as never);

			rerender({ data: { v: 1 } });
			await advance(DELAY);
			expect(fn).toHaveBeenCalledTimes(1);

			// Edit again while the first write is still outstanding.
			rerender({ data: { v: 2 } });
			await advance(DELAY);
			expect(fn).toHaveBeenCalledTimes(1);

			await act(async () => {
				resolve(0, { conflict: false, version: 4 });
			});
			expect(fn).toHaveBeenCalledTimes(2);
		});

		it("picks up the newest value and version after the in-flight save lands", async () => {
			const { fn, resolve } = deferredSave();
			const { rerender } = setup(fn as never);

			rerender({ data: { v: 1 } });
			await advance(DELAY);
			rerender({ data: { v: 2 } });
			rerender({ data: { v: 3 } });
			await advance(DELAY);

			await act(async () => {
				resolve(0, { conflict: false, version: 4 });
			});
			expect(fn.mock.calls[1][0]).toEqual({ v: 3 });
			expect(fn.mock.calls[1][1]).toBe(4);
		});
	});

	describe("conflict", () => {
		it("stops saving and reports a conflict when the server rejects a stale write", async () => {
			const save = vi.fn(async (): Promise<SaveResult> => ({ conflict: true }));
			const onConflict = vi.fn();
			const { result, rerender } = setup(save as never, { onConflict });

			rerender({ data: { v: 1 } });
			await advance(DELAY);
			expect(result.current.status).toBe("conflict");
			expect(onConflict).toHaveBeenCalledTimes(1);

			// Further edits must not overwrite whatever the other writer saved.
			rerender({ data: { v: 2 } });
			await advance(DELAY * 3);
			expect(save).toHaveBeenCalledTimes(1);
			expect(onConflict).toHaveBeenCalledTimes(1);
		});
	});

	describe("errors", () => {
		it("surfaces the error and retries on the next edit", async () => {
			const save = vi
				.fn<(d: unknown, v: number) => Promise<SaveResult>>()
				.mockRejectedValueOnce(new Error("offline"))
				.mockResolvedValue({ conflict: false, version: 4 });
			const onError = vi.fn();
			const { result, rerender } = setup(save as never, { onError });

			rerender({ data: { v: 1 } });
			await advance(DELAY);
			expect(result.current.status).toBe("error");
			expect(onError).toHaveBeenCalledTimes(1);

			rerender({ data: { v: 2 } });
			await advance(DELAY);
			expect(save).toHaveBeenCalledTimes(2);
			expect(result.current.status).toBe("saved");
		});
	});

	describe("flushing the tail", () => {
		it("saves pending changes on unmount instead of dropping them", async () => {
			const save = okSave();
			const { rerender, unmount } = setup(save);
			rerender({ data: { v: 1 } });
			await advance(DELAY / 2); // still inside the debounce window
			expect(save).not.toHaveBeenCalled();

			await act(async () => {
				unmount();
			});
			expect(save).toHaveBeenCalledTimes(1);
			expect(save.mock.calls[0][0]).toEqual({ v: 1 });
		});

		it("saves pending changes on pagehide", async () => {
			const save = okSave();
			const { rerender } = setup(save);
			rerender({ data: { v: 1 } });
			await advance(DELAY / 2);
			expect(save).not.toHaveBeenCalled();

			await act(async () => {
				window.dispatchEvent(new Event("pagehide"));
			});
			expect(save).toHaveBeenCalledTimes(1);
		});

		it("does not save on unmount when there is nothing pending", async () => {
			const save = okSave();
			const { rerender, unmount } = setup(save);
			rerender({ data: { v: 1 } });
			await advance(DELAY);
			expect(save).toHaveBeenCalledTimes(1);

			await act(async () => {
				unmount();
			});
			expect(save).toHaveBeenCalledTimes(1);
		});
	});
});
