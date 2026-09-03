import {
	Bounds,
	Center,
	Environment,
	OrbitControls,
	useBounds,
} from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import type { Node, NodeProps } from "@xyflow/react";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { BoardResizer } from "../board-resizer";
import { NodeDragHeader } from "../node-drag-header";
import { NodeHandles } from "../node-handles";
import { NodeUploadOverlay } from "../node-progress";

export const MODEL_DRAG_HANDLE_CLASS = "model-drag-handle";

import type { ModelFormat } from "#/lib/board/detect";

export type { ModelFormat };

interface ModelNodeData {
	uploading?: boolean;
	progress?: number;
	src: string;
	name: string;
	mimeType: string;
	format: ModelFormat;
	[key: string]: unknown;
}

export type ModelNode = Node<ModelNodeData, "model">;

function GLTFModel({ url }: { url: string }) {
	const gltf = useLoader(GLTFLoader, url);
	return <primitive object={gltf.scene} />;
}

function STLModel({ url }: { url: string }) {
	const geom = useLoader(STLLoader, url);
	return (
		<mesh geometry={geom}>
			<meshStandardMaterial color="#d4d4d8" metalness={0.1} roughness={0.6} />
		</mesh>
	);
}

function OBJModel({ url }: { url: string }) {
	const obj = useLoader(OBJLoader, url);
	useEffect(() => {
		obj.traverse((child) => {
			if ((child as THREE.Mesh).isMesh) {
				const m = child as THREE.Mesh;
				if (
					!m.material ||
					(Array.isArray(m.material) ? m.material.length === 0 : false)
				) {
					m.material = new THREE.MeshStandardMaterial({
						color: 0xd4d4d8,
						metalness: 0.1,
						roughness: 0.6,
					});
				}
			}
		});
	}, [obj]);
	return <primitive object={obj} />;
}

function ThreeMFModel({ url }: { url: string }) {
	const obj = useLoader(ThreeMFLoader, url);
	return <primitive object={obj} />;
}

function ModelBody({ url, format }: { url: string; format: ModelFormat }) {
	switch (format) {
		case "gltf":
		case "glb":
			return <GLTFModel url={url} />;
		case "stl":
			return <STLModel url={url} />;
		case "obj":
			return <OBJModel url={url} />;
		case "3mf":
			return <ThreeMFModel url={url} />;
	}
}

// Bounds' `observe` only re-fits on viewport resize; when the mesh finishes
// loading (Suspense unblocks), we need to trigger a refresh ourselves.
function AutoFit({ trigger }: { trigger: string }) {
	const bounds = useBounds();
	// `trigger` is deliberately in the dep list as a re-fit key: it is not read
	// in the body, but a change to it must re-run the fit.
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional re-run trigger
	useEffect(() => {
		const id = requestAnimationFrame(() => {
			// `.fit()` is drei's Bounds API, not a focused test. Do not accept
			// Biome's suggested rewrite to `.it()` — it breaks the auto-fit.
			// biome-ignore lint/suspicious/noFocusedTests: drei Bounds.fit(), not a test
			bounds.refresh().clip().fit();
		});
		return () => cancelAnimationFrame(id);
	}, [bounds, trigger]);
	return null;
}

export function ModelNodeView({
	data,
	selected,
	width,
	height,
}: NodeProps<ModelNode>) {
	// three/fiber's Canvas needs a browser env; skip during SSR / first paint.
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	return (
		<div className="group relative size-full" style={{ width, height }}>
			<BoardResizer minWidth={220} minHeight={180} selected={selected} />
			<div className="flex size-full flex-col overflow-hidden rounded-xl bg-neutral-900 text-white shadow-md">
				<NodeDragHeader
					handleClass={MODEL_DRAG_HANDLE_CLASS}
					className="h-6 justify-between gap-2 px-2 hover:text-gray-200"
					gripFirst={false}
				>
					<span className="truncate text-[10px] font-medium uppercase tracking-wide">
						{data.format} · {data.name}
					</span>
				</NodeDragHeader>
				<div className="relative min-h-0 flex-1">
					{mounted ? (
						<div className="absolute inset-0">
							<Canvas
								camera={{ position: [0, 0, 5], fov: 45 }}
								dpr={[1, 2]}
								onPointerDown={(e) => e.stopPropagation()}
								onWheel={(e) => e.stopPropagation()}
								gl={{ antialias: true }}
								resize={{ debounce: 0 }}
							>
								<color attach="background" args={["#171717"]} />
								<ambientLight intensity={0.5} />
								<directionalLight position={[5, 8, 5]} intensity={1.1} />
								<directionalLight position={[-5, -3, -5]} intensity={0.35} />
								<Suspense fallback={null}>
									<Environment preset="city" />
									<Bounds fit clip observe margin={1.2}>
										<Center>
											<ModelBody url={data.src} format={data.format} />
										</Center>
										<AutoFit trigger={`${data.src}:${data.format}`} />
									</Bounds>
								</Suspense>
								<OrbitControls
									enablePan={false}
									enableDamping
									dampingFactor={0.1}
									makeDefault
								/>
							</Canvas>
						</div>
					) : (
						<div className="flex h-full items-center justify-center text-xs text-gray-500">
							Loading 3D…
						</div>
					)}
				</div>
			</div>
			{data.uploading ? (
				<NodeUploadOverlay name={data.name} progress={data.progress} />
			) : null}
			<NodeHandles />
		</div>
	);
}
