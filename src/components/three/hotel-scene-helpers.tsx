"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { animate } from "animejs";
import * as THREE from "three";

/** Map of window index -> flash strength (1 → 0), decayed by WindowGrid each frame. */
export type WindowFlashes = { current: Map<number, number> };

export function gridSlot(
  col: number,
  row: number,
  cols: number,
  rows: number,
  gapX: number,
  gapY: number,
) {
  return new THREE.Vector3(
    col * gapX - ((cols - 1) * gapX) / 2,
    row * gapY - ((rows - 1) * gapY) / 2,
    0,
  );
}

const WINDOW_DARK = new THREE.Color("#16273c");
const WINDOW_WARM = new THREE.Color("#ffd095");
const WINDOW_TEAL = new THREE.Color("#6fd9cd");

type WindowGridProps = {
  cols: number;
  rows: number;
  gapX?: number;
  gapY?: number;
  winW?: number;
  winH?: number;
  reducedMotion?: boolean;
  flashes?: WindowFlashes;
  position?: [number, number, number];
  rotation?: [number, number, number];
  intensity?: number;
};

/**
 * Instanced grid of hotel room windows. Each window twinkles on its own
 * cycle (rooms lighting up through the night); optional flashes let a
 * "booking pulse" light a specific room on arrival.
 */
export function WindowGrid({
  cols,
  rows,
  gapX = 0.31,
  gapY = 0.34,
  winW = 0.17,
  winH = 0.22,
  reducedMotion = false,
  flashes,
  position,
  rotation,
  intensity = 1,
}: WindowGridProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = cols * rows;
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const windows = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        speed: 0.12 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        cutoff: -0.15 + Math.random() * 0.75,
        warm: Math.random() < 0.82,
      })),
    [count],
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        matrix.setPosition(gridSlot(col, row, cols, rows, gapX, gapY));
        mesh.setMatrixAt(row * cols + col, matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [cols, rows, gapX, gapY]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    // Freeze the twinkle at a pleasant mid-cycle when reduced motion is on.
    const t = reducedMotion ? 20 : state.clock.getElapsedTime();
    for (let i = 0; i < count; i += 1) {
      const w = windows[i];
      const wave = Math.sin(t * w.speed + w.phase);
      const lit = THREE.MathUtils.smoothstep(wave, w.cutoff - 0.1, w.cutoff + 0.1);
      let flash = 0;
      if (flashes) {
        const current = flashes.current.get(i);
        if (current !== undefined) {
          flash = current;
          const next = current - delta / 1.3;
          if (next <= 0) flashes.current.delete(i);
          else flashes.current.set(i, next);
        }
      }
      const strength = Math.min(1, (lit * 0.8 + flash * 1.3) * intensity);
      tmpColor.copy(WINDOW_DARK).lerp(w.warm ? WINDOW_WARM : WINDOW_TEAL, strength);
      mesh.setColorAt(i, tmpColor);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      position={position}
      rotation={rotation}
      frustumCulled={false}
    >
      <planeGeometry args={[winW, winH]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

export function Stars({
  count = 240,
  spreadX = 24,
  height = 9,
}: {
  count?: number;
  spreadX?: number;
  height?: number;
}) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * spreadX;
      arr[i * 3 + 1] = Math.random() * height - 1.5;
      arr[i * 3 + 2] = -4 - Math.random() * 8;
    }
    return arr;
  }, [count, spreadX, height]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#9AABBB"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/** Gentle camera parallax that follows the pointer (fine pointers only). */
export function ParallaxRig({
  children,
  reducedMotion = false,
  strength = 1,
}: {
  children: React.ReactNode;
  reducedMotion?: boolean;
  strength?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (event: MouseEvent) => {
      target.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      target.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reducedMotion]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const k = Math.min(delta * 3, 1);
    group.rotation.y += (target.current.x * 0.05 * strength - group.rotation.y) * k;
    group.rotation.x += (target.current.y * 0.03 * strength - group.rotation.x) * k;
  });

  return <group ref={groupRef}>{children}</group>;
}

/** Anime.js-eased dolly-in when the scene mounts. */
export function CameraIntro({
  from,
  to,
  reducedMotion = false,
}: {
  from: [number, number, number];
  to: [number, number, number];
  reducedMotion?: boolean;
}) {
  const camera = useThree((state) => state.camera);
  const [fx, fy, fz] = from;
  const [tx, ty, tz] = to;

  useEffect(() => {
    if (reducedMotion) {
      camera.position.set(tx, ty, tz);
      return;
    }
    camera.position.set(fx, fy, fz);
    const anim = animate(camera.position, {
      x: tx,
      y: ty,
      z: tz,
      duration: 1900,
      ease: "out(3)",
    });
    return () => {
      anim.cancel();
    };
  }, [camera, reducedMotion, fx, fy, fz, tx, ty, tz]);

  return null;
}
