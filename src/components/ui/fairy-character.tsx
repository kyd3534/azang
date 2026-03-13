"use client";

import { useRef, Suspense, useEffect, useMemo, useState, Component, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Center, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

/* ─── Error Boundary ────────────────────────────────────────── */
class ThreeEB extends Component<
  { children: ReactNode; fallback: ReactNode },
  { err: boolean }
> {
  constructor(p: { children: ReactNode; fallback: ReactNode }) { super(p); this.state = { err: false }; }
  static getDerivedStateFromError() { return { err: true }; }
  render() { return this.state.err ? this.props.fallback : this.props.children; }
}

/* ─── 3D 씬 ─────────────────────────────────────────────────── */
function CharacterScene({
  dragRef, mouseRef, onLoaded,
}: {
  dragRef:  React.RefObject<{ on: boolean; curX: number; curY: number; prevX: number; prevY: number }>;
  mouseRef: React.RefObject<{ x: number; y: number }>;
  onLoaded: () => void;
}) {
  const { scene } = useGLTF("/character.glb");
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material)
        obj.material = (obj.material as THREE.Material).clone();
    });
    return clone;
  }, [scene]);

  const groupRef     = useRef<THREE.Group>(null);
  const fitted       = useRef(false);
  const loadedCalled = useRef(false);
  const rotY = useRef(0), rotX = useRef(0);
  const velY = useRef(0), velX = useRef(0);
  const FACE = -Math.PI / 2;

  useFrame(({ camera }, delta) => {
    if (!fitted.current && groupRef.current) {
      const box = new THREE.Box3().setFromObject(groupRef.current);
      if (!box.isEmpty()) {
        const size   = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const fov    = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
        const dist   = (Math.max(size.x, size.y, size.z) / 2) / Math.tan(fov / 2) * 1.15;
        camera.position.set(center.x, center.y, center.z + dist);
        camera.lookAt(center);
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
        fitted.current = true;
        if (!loadedCalled.current) { loadedCalled.current = true; onLoaded(); }
      }
    }
    if (!groupRef.current) return;

    const drag = dragRef.current;
    if (drag.on) {
      velY.current = (drag.curX - drag.prevX) * 0.018;
      velX.current = (drag.curY - drag.prevY) * 0.012;
      drag.prevX = drag.curX; drag.prevY = drag.curY;
    } else {
      velY.current *= 0.88; velX.current *= 0.88;
    }
    rotY.current += velY.current;
    rotX.current = Math.max(-0.5, Math.min(0.5, rotX.current + velX.current));

    const gf    = Math.max(0, 1 - Math.abs(velY.current) * 8);
    const gazeY = mouseRef.current.x * 0.18 * gf;
    const gazeX = mouseRef.current.y * 0.10 * gf;
    const k     = 1 - Math.pow(0.01, delta);
    groupRef.current.rotation.y += (FACE + rotY.current + gazeY - groupRef.current.rotation.y) * k;
    groupRef.current.rotation.x += (rotX.current + gazeX - groupRef.current.rotation.x) * k;
    groupRef.current.position.y = Math.sin(Date.now() / 900) * 0.05;
  });

  return (
    <group ref={groupRef}>
      <Center><primitive object={clonedScene} /></Center>
    </group>
  );
}

/* ─── 메인 컴포넌트 ─────────────────────────────────────────── */
export default function FairyCharacter() {
  const dragRef       = useRef({ on: false, curX: 0, curY: 0, prevX: 0, prevY: 0 });
  const mouseRef      = useRef({ x: 0, y: 0 });
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  // R3F Canvas가 내부에서 stopPropagation() 호출 → React synthetic events 막힘
  // native addEventListener로 직접 등록해서 우회
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;

    const getRect = () => el.getBoundingClientRect();

    const updateMouse = (clientX: number, clientY: number) => {
      const r = getRect();
      mouseRef.current = {
        x:  (clientX - r.left - r.width  / 2) / (r.width  / 2),
        y: -(clientY - r.top  - r.height / 2) / (r.height / 2),
      };
    };

    // ── 터치 ──
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      dragRef.current = { on: true, curX: t.clientX, curY: t.clientY, prevX: t.clientX, prevY: t.clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // 스크롤 방지
      const t = e.touches[0];
      if (dragRef.current.on) {
        dragRef.current.curX = t.clientX;
        dragRef.current.curY = t.clientY;
      } else {
        updateMouse(t.clientX, t.clientY);
      }
    };
    const onTouchEnd = () => {
      dragRef.current.on = false;
      mouseRef.current = { x: 0, y: 0 };
    };

    // ── 마우스 ──
    const onMouseMove = (e: MouseEvent) => {
      if (dragRef.current.on) {
        dragRef.current.curX = e.clientX;
        dragRef.current.curY = e.clientY;
      } else {
        updateMouse(e.clientX, e.clientY);
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      dragRef.current = { on: true, curX: e.clientX, curY: e.clientY, prevX: e.clientX, prevY: e.clientY };
    };
    const onMouseUp = () => { dragRef.current.on = false; };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove",  onTouchMove,  { passive: false });
    el.addEventListener("touchend",   onTouchEnd,   { passive: true  });
    el.addEventListener("mousemove",  onMouseMove,  { passive: true  });
    el.addEventListener("mousedown",  onMouseDown,  { passive: true  });
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove",  onTouchMove);
      el.removeEventListener("touchend",   onTouchEnd);
      el.removeEventListener("mousemove",  onMouseMove);
      el.removeEventListener("mousedown",  onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div
      ref={canvasWrapRef}
      style={{
        width: "100%", maxWidth: 320, height: 320,
        cursor: "grab", touchAction: "none",
        filter: "drop-shadow(0 12px 32px rgba(168,85,247,0.22)) drop-shadow(0 0 20px #c4b5fd55)",
      }}
    >
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 8,
        }}>
          <span style={{ fontSize: 56, animation: "pulse 1.5s ease-in-out infinite" }}>🧸</span>
          <span style={{ fontSize: 11, color: "#C4B5FD", fontWeight: 700 }}>몽글이 불러오는 중...</span>
        </div>
      )}
      <ThreeEB fallback={
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 80 }}>🧸</span>
        </div>
      }>
        <Canvas
          shadows={false}
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{
            width: "100%", height: "100%", display: "block", background: "transparent",
            opacity: loaded ? 1 : 0, transition: "opacity 0.4s ease",
          }}
        >
          <ambientLight intensity={1.8} />
          <directionalLight position={[3, 6, 5]} intensity={2.2} />
          <pointLight position={[-3, 4, 3]} intensity={1.2} color="#ffd6f0" />
          <pointLight position={[3, 2, -3]} intensity={0.8} color="#c4b5fd" />
          <Suspense fallback={null}>
            <CharacterScene dragRef={dragRef} mouseRef={mouseRef} onLoaded={() => setLoaded(true)} />
            <ContactShadows position={[0, -1.2, 0]} opacity={0.25} scale={5} blur={2} far={3} />
          </Suspense>
        </Canvas>
      </ThreeEB>
      <style>{`@keyframes pulse{0%,100%{opacity:.5;transform:scale(.95)}50%{opacity:1;transform:scale(1.05)}}`}</style>
    </div>
  );
}

useGLTF.preload("/character.glb");
