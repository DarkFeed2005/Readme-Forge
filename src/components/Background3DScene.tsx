"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PointMaterial, Points } from "@react-three/drei";
import * as THREE from "three";

const mouse = { x: 0, y: 0 };

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 650;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 4 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = radius * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((_state, delta) => {
    const points = pointsRef.current;
    if (!points) return;
    points.rotation.y += delta * 0.04;
    points.rotation.x = THREE.MathUtils.lerp(points.rotation.x, -mouse.y * 0.18, 0.05);
    points.rotation.z = THREE.MathUtils.lerp(points.rotation.z, mouse.x * 0.18, 0.05);
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#a78bfa"
        size={0.035}
        sizeAttenuation
        depthWrite={false}
        opacity={0.75}
      />
    </Points>
  );
}

function GlowRings() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.y += delta * 0.12;
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, -mouse.y * 0.12, 0.05);
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, mouse.x * 0.12, 0.05);
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.7}>
        <mesh rotation={[Math.PI / 2.15, 0, 0]}>
          <torusGeometry args={[3.2, 0.02, 10, 128]} />
          <meshStandardMaterial
            color="#8b5cf6"
            emissive="#6d28d9"
            emissiveIntensity={1.4}
            metalness={0.4}
            roughness={0.35}
          />
        </mesh>
      </Float>
      <Float speed={1} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh rotation={[Math.PI / 1.85, 0.4, 0]}>
          <torusGeometry args={[4.15, 0.012, 10, 128]} />
          <meshStandardMaterial
            color="#6366f1"
            emissive="#4338ca"
            emissiveIntensity={1.1}
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
      </Float>
    </group>
  );
}

export default function Background3DScene() {
  useEffect(() => {
    const onPointerMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onPointerMove, { passive: true });
    return () => window.removeEventListener("mousemove", onPointerMove);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[-1]">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8], fov: 55 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[6, 5, 6]} intensity={70} color="#8b5cf6" />
        <pointLight position={[-7, -4, 5]} intensity={45} color="#6366f1" />
        <ParticleField />
        <GlowRings />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/20 to-slate-950/85" />
    </div>
  );
}
