"use client";

/**
 * "Midnight Booking" — landing hero scene.
 *
 * A procedural hotel tower at night: room windows twinkle as guests settle
 * in, and glowing booking pulses arc from the page into the building,
 * lighting up the room they land in. Navy / teal / champagne palette,
 * decorative only (aria-hidden, pointer-events none).
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { animate } from "animejs";
import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  CameraIntro,
  ParallaxRig,
  Stars,
  WindowGrid,
  gridSlot,
  type WindowFlashes,
} from "@/components/three/hotel-scene-helpers";

const TOWER = {
  cols: 9,
  rows: 12,
  gapX: 0.31,
  gapY: 0.34,
  width: 2.9,
  height: 4.3,
  depth: 1.7,
};

function TowerBody() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[TOWER.width, TOWER.height, TOWER.depth]} />
        <meshStandardMaterial color="#10233a" metalness={0.25} roughness={0.6} />
      </mesh>
      {/* Rooftop sign strip */}
      <mesh position={[0, TOWER.height / 2 + 0.09, 0]}>
        <boxGeometry args={[2.3, 0.1, 0.22]} />
        <meshBasicMaterial color="#2dd4c8" toneMapped={false} transparent opacity={0.85} />
      </mesh>
      {/* Glowing lobby entrance */}
      <mesh position={[0, -TOWER.height / 2 + 0.28, TOWER.depth / 2 + 0.01]}>
        <planeGeometry args={[0.9, 0.52]} />
        <meshBasicMaterial color="#ffd9a0" toneMapped={false} transparent opacity={0.92} />
      </mesh>
      {/* Brass entrance canopy */}
      <mesh position={[0, -TOWER.height / 2 + 0.62, TOWER.depth / 2 + 0.2]}>
        <boxGeometry args={[1.25, 0.06, 0.42]} />
        <meshStandardMaterial color="#C89B5D" metalness={0.65} roughness={0.3} />
      </mesh>
    </group>
  );
}

function BookingPulse({
  index,
  flashes,
  reducedMotion,
}: {
  index: number;
  flashes: WindowFlashes;
  reducedMotion: boolean;
}) {
  const headRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const progress = useRef({ t: 0 });
  const targetIndex = useRef(0);
  const curveRef = useRef(
    new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    ),
  );

  const pickTarget = useCallback(() => {
    const col = Math.floor(Math.random() * TOWER.cols);
    const row = Math.floor(Math.random() * TOWER.rows);
    targetIndex.current = row * TOWER.cols + col;
    const end = gridSlot(col, row, TOWER.cols, TOWER.rows, TOWER.gapX, TOWER.gapY);
    end.z = TOWER.depth / 2 + 0.05;
    const start = new THREE.Vector3(
      -5.6 - index * 0.7,
      -2.4 + index * 0.5,
      2.4 + index * 0.4,
    );
    const mid = start.clone().lerp(end, 0.45);
    mid.y += 1.7;
    mid.z += 1.1;
    curveRef.current = new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [index]);

  useEffect(() => {
    pickTarget();
    if (reducedMotion) return;
    const anim = animate(progress.current, {
      t: 1,
      duration: 3000 + index * 450,
      delay: 700 + index * 1200,
      loop: true,
      loopDelay: 500 + index * 350,
      ease: "inOut(1.8)",
      onLoop: () => {
        // Light up the room the booking just landed in, then aim at a new one.
        flashes.current.set(targetIndex.current, 1);
        progress.current.t = 0;
        pickTarget();
      },
    });
    return () => {
      anim.cancel();
    };
  }, [index, reducedMotion, flashes, pickTarget]);

  useFrame(() => {
    const head = headRef.current;
    const tail = tailRef.current;
    if (!head || !tail) return;
    if (reducedMotion) {
      head.visible = false;
      tail.visible = false;
      return;
    }
    const t = Math.min(progress.current.t, 1);
    const fade = Math.sin(Math.PI * t);
    head.position.copy(curveRef.current.getPoint(t));
    head.scale.setScalar(0.055 + 0.05 * fade);
    (head.material as THREE.MeshBasicMaterial).opacity = fade * 0.95;
    tail.position.copy(curveRef.current.getPoint(Math.max(t - 0.055, 0)));
    tail.scale.setScalar(0.035 + 0.03 * fade);
    (tail.material as THREE.MeshBasicMaterial).opacity = fade * 0.45;
  });

  return (
    <>
      <mesh ref={headRef}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial
          color="#ffd9a0"
          transparent
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={tailRef}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial
          color="#6fd9cd"
          transparent
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

function Moon() {
  return (
    <group position={[-3.6, 2.7, -3.5]}>
      <mesh>
        <sphereGeometry args={[0.42, 24, 16]} />
        <meshBasicMaterial color="#e8eef4" toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.62, 24, 16]} />
        <meshBasicMaterial
          color="#e8eef4"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function BackgroundTower({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group position={[-3.1, -0.5, -2.8]} rotation={[0, -0.2, 0]}>
      <mesh>
        <boxGeometry args={[1.8, 3.3, 1.2]} />
        <meshStandardMaterial color="#0d1a2a" roughness={0.7} />
      </mesh>
      <WindowGrid
        cols={5}
        rows={8}
        gapX={0.3}
        gapY={0.36}
        winW={0.13}
        winH={0.17}
        intensity={0.65}
        reducedMotion={reducedMotion}
        position={[0, 0, 0.61]}
      />
    </group>
  );
}

function MidnightBookingScene({ reducedMotion }: { reducedMotion: boolean }) {
  const flashes = useRef(new Map<number, number>());
  // On narrow (portrait / mobile) viewports the wide composition would sit
  // off-screen, so shrink it and pull it toward the center.
  const size = useThree((state) => state.size);
  const aspect = size.width / size.height;
  const narrow = aspect < 0.9;
  const worldScale = narrow ? 0.62 : THREE.MathUtils.clamp(aspect * 0.55, 0.85, 1);
  const worldPos: [number, number, number] = narrow ? [-0.5, 0.35, 0] : [0, 0, 0];

  return (
    <>
      <fog attach="fog" args={["#0B1420", 8, 20]} />
      <CameraIntro from={[0, 0.9, 9]} to={[0, 0.5, 7.2]} reducedMotion={reducedMotion} />
      <ParallaxRig reducedMotion={reducedMotion}>
        <Stars count={narrow ? 130 : 240} />
        <group scale={worldScale} position={worldPos}>
        <Moon />
        <BackgroundTower reducedMotion={reducedMotion} />
        <group position={[1.55, 0.15, 0]} rotation={[0, 0.34, 0]}>
          <TowerBody />
          <WindowGrid
            cols={TOWER.cols}
            rows={TOWER.rows}
            gapX={TOWER.gapX}
            gapY={TOWER.gapY}
            reducedMotion={reducedMotion}
            flashes={flashes}
            position={[0, 0, TOWER.depth / 2 + 0.01]}
          />
          <WindowGrid
            cols={5}
            rows={TOWER.rows}
            gapX={0.31}
            gapY={TOWER.gapY}
            winW={0.15}
            winH={0.22}
            intensity={0.8}
            reducedMotion={reducedMotion}
            position={[-TOWER.width / 2 - 0.01, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
          />
          {[0, 1, 2].map((i) => (
            <BookingPulse key={i} index={i} flashes={flashes} reducedMotion={reducedMotion} />
          ))}
        </group>
        {/* Night ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.35, 0]}>
          <circleGeometry args={[14, 40]} />
          <meshBasicMaterial color="#06101b" />
        </mesh>
        </group>
      </ParallaxRig>
      <ambientLight intensity={0.45} />
      <directionalLight position={[-4, 6, 3]} intensity={0.9} color="#dbe7f3" />
      <pointLight position={[1.5, -1.6, 2.4]} intensity={0.8} color="#ffb95e" distance={6} />
    </>
  );
}

export function ConnectedStayCanvas({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="absolute inset-0" aria-hidden="true" style={{ pointerEvents: "none" }}>
      <Canvas
        dpr={[1, 1.5]}
        frameloop={reducedMotion ? "demand" : "always"}
        camera={{ position: [0, 0.5, 7.2], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <MidnightBookingScene reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
