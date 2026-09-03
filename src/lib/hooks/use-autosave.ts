import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus =
	| "idle"
	| "pending"
	| "saving"
	| "saved"
	| "error"
	| "conflict";

export type SaveResult =
	| { conflict: false; version: number }
	| { conflict: true };

interface Options<T> {
	/** Current value to persist. Must be referentially stable between edits. */
	data: T;
	/** Version the client last observed. Sent with every write. */
	initialVersion: number;
	save: (data: T, version: number) => Promise<SaveResult>;
	/** Called once, when the server first rejects a write as stale. */
	onConflict?: () => void;
	onError?: (error: unknown) => void;
	delayMs?: number;
}

export const DEFAULT_SAVE_DELAY_MS = 800;

/**
 * Debounced autosave with three guarantees the naive version lacked:
 *
 * - **No overlapping writes.** While a save is in flight, further edits mark the
 *   value dirty and are picked up by the same loop when it finishes, so two
 *   writes can never race each other.
 * - **No lost tail.** Pending changes are flushed on unmount (route change) and
 *   on `pagehide`, instead of the timer simply being cleared.
 * - **No clobbering.** Each write carries the version the client loaded. Once
 *   the server rejects one as stale, autosaving stops rather than overwriting
 *   whatever the other writer saved.
 */
export function useAutosave<T>({
	data,
	initialVersion,
	save,
	onConflict,
	onError,
	delayMs = DEFAULT_SAVE_DELAY_MS,
}: Options<T>) {
	const [status, setStatus] = useState<SaveStatus>("idle");

	// Kept in refs so `runSave` stays referentially stable: the flush effect
	// below must mount once, not re-run whenever a caller passes new closures.
	const dataRef = useRef(data);
	const saveRef = useRef(save);
	const onConflictRef = useRef(onConflict);
	const onErrorRef = useRef(onError);
	dataRef.current = data;
	saveRef.current = save;
	onConflictRef.current = onConflict;
	onErrorRef.current = onError;

	const versionRef = useRef(initialVersion);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const inFlightRef = useRef(false);
	const dirtyRef = useRef(false);
	const stoppedRef = useRef(false);
	const isFirstRunRef = useRef(true);

	const runSave = useCallback(async () => {
		if (stoppedRef.current || inFlightRef.current || !dirtyRef.current) return;
		inFlightRef.current = true;
		try {
			// Loop rather than return: edits that land mid-flight are coalesced
			// into the next iteration instead of being dropped.
			while (dirtyRef.current && !stoppedRef.current) {
				dirtyRef.current = false;
				setStatus("saving");
				try {
					const result = await saveRef.current(
						dataRef.current,
						versionRef.current,
					);
					if (result.conflict) {
						stoppedRef.current = true;
						setStatus("conflict");
						onConflictRef.current?.();
						return;
					}
					versionRef.current = result.version;
				} catch (error) {
					// Stay dirty so the next edit retries, but stop looping now.
					dirtyRef.current = true;
					setStatus("error");
					onErrorRef.current?.(error);
					return;
				}
			}
			setStatus("saved");
		} finally {
			inFlightRef.current = false;
		}
	}, []);

	// `data` is the trigger: the body reads dataRef, not data, but a new value
	// must (re)start the debounce. `status` is deliberately NOT a dependency --
	// depending on it would re-run this effect on every status change and
	// reschedule the timer in a loop.
	// biome-ignore lint/correctness/useExhaustiveDependencies: `data` is the change trigger
	useEffect(() => {
		if (isFirstRunRef.current) {
			isFirstRunRef.current = false;
			return;
		}
		if (stoppedRef.current) return;
		dirtyRef.current = true;
		setStatus("pending");
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => {
			void runSave();
		}, delayMs);
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [data, delayMs, runSave]);

	// Flush anything still pending when the board goes away.
	useEffect(() => {
		const flush = () => {
			if (timerRef.current) clearTimeout(timerRef.current);
			if (dirtyRef.current) void runSave();
		};
		window.addEventListener("pagehide", flush);
		return () => {
			window.removeEventListener("pagehide", flush);
			flush();
		};
	}, [runSave]);

	return { status };
}
