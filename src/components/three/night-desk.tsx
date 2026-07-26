"use client";

/**
 * "Night Check-in" — login page scene.
 *
 * A floating brass room key card and a reception bell (with a soft
 * expanding "ding" ring) in front of a hotel facade whose room windows
 * twinkle through the night. Decorative only.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { animate } from "animejs";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  CameraIntro,
  ParallaxRig,
  Stars,
  WindowGrid,
} from "@/components/three/hotel-scene-helpers";

function KeyCard({
  position,
  reducedMotion,
}: {
  position: [number, number, number];
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const t = reducedMotion ? 0 : state.clock.getElapsedTime();
    group.rotation.y = -0.35 + Math.sin(t * 0.4) * 0.16;
    group.rotation.x = 0.12 + Math.cos(t * 0.33) * 0.06;
    group.position.y = Math.sin(t * 0.7) * 0.07;
  });

  return (
    <group position={position}>
      <group ref={groupRef}>
        <RoundedBox args={[1.6, 1.0, 0.06]} radius={0.07} smoothness={4}>
          <meshStandardMaterial color="#C89B5D" metalness={0.75} roughness={0.28} />
        </RoundedBox>
        {/* Magnetic stripe */}
        <mesh position={[0, 0.32, 0.034]}>
          <boxGeometry args={[1.58, 0.2, 0.006]} />
          <meshStandardMaterial color="#0B1420" roughness={0.5} />
        </mesh>
        {/* Chip */}
        <mesh position={[-0.5, -0.04, 0.036]}>
          <boxGeometry args={[0.24, 0.18, 0.008]} />
          <meshStandardMaterial color="#F1DCB8" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Embossed detail lines (room / guest name) */}
        <mesh position={[0.12, -0.16, 0.034]}>
          <boxGeometry args={[0.5, 0.055, 0.004]} />
          <meshBasicMaterial color="#132131" />
        </mesh>
        <mesh position={[0.3, -0.32, 0.034]}>
          <boxGeometry args={[0.86, 0.055, 0.004]} />
          <meshBasicMaterial color="#132131" />
        </mesh>
      </group>
    </group>
  );
}

function BellRing({
  delay,
  reducedMotion,
}: {
  delay: number;
  reducedMotion: boolean;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const progress = useRef({ p: 0 });

  useEffect(() => {
    if (reducedMotion) return;
    const anim = animate(progress.current, {
      p: 1,
      duration: 2400,
      delay,
      loop: true,
      loopDelay: 2000,
      ease: "out(2)",
    });
    return () => {
      anim.cancel();
    };
  }, [delay, reducedMotion]);

  useFrame(() => {
    const ring = ringRef.current;
    if (!ring) return;
    if (reducedMotion) {
      ring.visible = false;
      return;
    }
    const p = progress.current.p;
    ring.scale.setScalar(0.4 + p * 1.9);
    (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - p) * 0.5);
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
      <torusGeometry args={[0.5, 0.012, 8, 48]} />
      <meshBasicMaterial
        color="#D6AE73"
        transparent
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}

function ReceptionBell({
  position,
  reducedMotion,
}: {
  position: [number, number, number];
  reducedMotion: boolean;
}) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 0.07, 40]} />
        <meshStandardMaterial color="#132131" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Dome */}
      <mesh position={[0, 0.09, 0]}>
        <sphereGeometry args={[0.36, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#C89B5D" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Knob */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.05, 16, 12]} />
        <meshStandardMaterial color="#F1DCB8" metalness={0.9} roughness={0.2} />
      </mesh>
      <BellRing delay={800} reducedMotion={reducedMotion} />
      <BellRing delay={1300} reducedMotion={reducedMotion} />
    </group>
  );
}

function HotelFacade({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <group position={[0, 0.45, -3]} rotation={[0, 0.22, 0]}>
      <mesh>
        <boxGeometry args={[3.4, 4.4, 0.35]} />
        <meshStandardMaterial color="#0e1c2c" roughness={0.7} />
      </mesh>
      {/* Rooftop accent */}
      <mesh position={[0, 2.28, 0]}>
        <boxGeometry args={[2.6, 0.08, 0.28]} />
        <meshBasicMaterial color="#2dd4c8" toneMapped={false} transparent opacity={0.7} />
      </mesh>
      <WindowGrid
        cols={8}
        rows={10}
        gapX={0.36}
        gapY={0.4}
        winW={0.16}
        winH={0.2}
        intensity={0.85}
        reducedMotion={reducedMotion}
        position={[0, 0, 0.19]}
      />
    </group>
  );
}

function NightCheckInScene({ reducedMotion }: { reducedMotion: boolean }) {
  // The sign-in card sits centered over the canvas, so the composition frames
  // around it and rescales for narrow (portrait / mobile) viewports.
  const size = useThree((state) => state.size);
  const aspect = size.width / size.height;
  const portrait = aspect < 0.9;
  const sceneScale = portrait
    ? 0.62
    : THREE.MathUtils.clamp(0.55 + aspect * 0.28, 0.8, 1.05);
  const keyCardPos: [number, number, number] = portrait
    ? [-0.75, 1.6, 0.5]
    : [-1.8, 0.65, 0.6];
  const bellPos: [number, number, number] = portrait
    ? [0.85, -1.75, 0.4]
    : [1.9, -1.05, 0.4];

  return (
    <>
      <fog attach="fog" args={["#0B1420", 6, 15]} />
      <CameraIntro from={[0, 0.4, 6]} to={[0, 0.25, 4.7]} reducedMotion={reducedMotion} />
      <ParallaxRig reducedMotion={reducedMotion} strength={1.2}>
        <Stars count={portrait ? 110 : 150} spreadX={16} height={7} />
        <group scale={sceneScale}>
          <HotelFacade reducedMotion={reducedMotion} />
          <KeyCard position={keyCardPos} reducedMotion={reducedMotion} />
          <ReceptionBell position={bellPos} reducedMotion={reducedMotion} />
        </group>
      </ParallaxRig>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 3]} intensity={1.1} color="#e8eef4" />
      <pointLight position={[-2, 1, 2]} intensity={0.5} color="#6fd9cd" distance={7} />
      <pointLight position={[1.4, -0.4, 1.6]} intensity={0.7} color="#ffb95e" distance={5} />
    </>
  );
}

export function NightDeskCanvas({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="absolute inset-0" aria-hidden="true" style={{ pointerEvents: "none" }}>
      <Canvas
        dpr={[1, 1.5]}
        frameloop={reducedMotion ? "demand" : "always"}
        camera={{ position: [0, 0.25, 4.7], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <NightCheckInScene reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
