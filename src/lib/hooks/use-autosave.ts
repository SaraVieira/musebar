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

const DEFAULT_SAVE_DELAY_MS = 800;

export function useAutosave<T>({
	data,
	initialVersion,
	save,
	onConflict,
	onError,
	delayMs = DEFAULT_SAVE_DELAY_MS,
}: Options<T>) {
	const [status, setStatus] = useState<SaveStatus>("idle");

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
