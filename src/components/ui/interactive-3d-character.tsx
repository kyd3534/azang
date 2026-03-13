"use client";

import React, { useEffect, useRef } from "react";

/* ── CDN 라이브러리 타입 선언 ── */
declare global {
  interface Window {
    Zdog: any;
    TweenMax: any;
    TweenLite: any;
    Sine: any;
  }
}

/* ── 팔레트 ── */
const PALETTE = {
  dark: "#080000",
  light: "#fff",
  skin: "hsl(120, 40%, 80%)",
  skinHighlight: "hsl(120, 40%, 90%)",
  skinShadow: "hsl(120, 30%, 60%)",
  flesh: "hsl(120, 50%, 30%)",
};

const SCENE_SIZE = 400;

/* ── 캐릭터 모델 생성 ── */
function createCharacterModel(illo: any) {
  const Zdog = window.Zdog;

  const headAnchor = new Zdog.Anchor({ addTo: illo, translate: { y: -42 } });
  new Zdog.Group({ addTo: headAnchor });
  new Zdog.Shape({ addTo: headAnchor.children[0], stroke: 228, color: PALETTE.skinShadow, path: [{ x: -4.5 }, { x: 4.5 }] });
  new Zdog.Shape({ addTo: headAnchor.children[0], stroke: 216, color: PALETTE.skin, translate: { x: -4.5 } });

  const eyeAnchor = new Zdog.Anchor({ addTo: headAnchor, translate: { x: -66, y: -30, z: 84 }, rotate: { y: Zdog.TAU / 11 } });
  const eyeGroup = new Zdog.Group({ addTo: eyeAnchor });

  new Zdog.Shape({
    addTo: eyeGroup, fill: true, stroke: 0, color: PALETTE.skinShadow, scale: 1.15,
    path: [{ x: 0, y: 0, z: 3 }, { bezier: [{ x: 24, y: 0, z: 3 }, { x: 36, y: 21, z: 0 }, { x: 36, y: 36, z: 0 }] }, { bezier: [{ x: 36, y: 51, z: 0 }, { x: 24, y: 63, z: 3 }, { x: 0, y: 63, z: 3 }] }, { bezier: [{ x: -24, y: 63, z: 3 }, { x: -36, y: 51, z: 0 }, { x: -36, y: 36, z: 0 }] }, { bezier: [{ x: -36, y: 21, z: 0 }, { x: -24, y: 0, z: 3 }, { x: 0, y: 0, z: 3 }] }]
  });

  const eye = new Zdog.Shape({
    addTo: eyeGroup, fill: true, stroke: 3, color: PALETTE.dark, translate: { y: 6 },
    path: [{ x: 0, y: 0, z: 3 }, { bezier: [{ x: 24, y: 0, z: 3 }, { x: 36, y: 21, z: 0 }, { x: 36, y: 36, z: 0 }] }, { bezier: [{ x: 36, y: 51, z: 0 }, { x: 24, y: 63, z: 3 }, { x: 0, y: 63, z: 3 }] }, { bezier: [{ x: -24, y: 63, z: 3 }, { x: -36, y: 51, z: 0 }, { x: -36, y: 36, z: 0 }] }, { bezier: [{ x: -36, y: 21, z: 0 }, { x: -24, y: 0, z: 3 }, { x: 0, y: 0, z: 3 }] }]
  });

  eye.copy({ addTo: eye, fill: true, color: PALETTE.light, scale: 0.4, translate: { x: -9, y: 9, z: 3 } });


  const eyeLeft = eyeAnchor.copyGraph({ translate: { x: 66, y: -30, z: 84 }, rotate: { y: Zdog.TAU / -11 } });

  const mouthAnchor = new Zdog.Anchor({ addTo: headAnchor, translate: { y: 36, z: 96 }, rotate: { x: Zdog.TAU / -45 } });
  const mouthGroup = new Zdog.Group({ addTo: mouthAnchor });
  // 웃는 입 (shadow)
  new Zdog.Shape({ addTo: mouthGroup, stroke: 10, fill: false, color: PALETTE.skinShadow, closed: false, translate: { z: -1 },
    path: [{ x: -30, y: 0 }, { bezier: [{ x: -14, y: 30 }, { x: 14, y: 30 }, { x: 30, y: 0 }] }]
  });
  // 웃는 입 (main dark line)
  new Zdog.Shape({ addTo: mouthGroup, stroke: 8, fill: false, color: PALETTE.dark, closed: false,
    path: [{ x: -30, y: 0 }, { bezier: [{ x: -14, y: 30 }, { x: 14, y: 30 }, { x: 30, y: 0 }] }]
  });
  // 입꼬리 하이라이트
  new Zdog.Shape({ addTo: mouthGroup, stroke: 5, fill: false, color: PALETTE.skinHighlight, closed: false,
    translate: { z: 1 },
    path: [{ x: -28, y: 2 }, { bezier: [{ x: -13, y: 26 }, { x: 13, y: 26 }, { x: 28, y: 2 }] }]
  });

  const bodyAnchor = new Zdog.Anchor({ addTo: illo, translate: { y: 81 } });
  const bodyGroup = new Zdog.Group({ addTo: bodyAnchor });
  const bodyUpperGroup = new Zdog.Group({ addTo: bodyGroup });
  const bodyUpper = new Zdog.Shape({ addTo: bodyUpperGroup, stroke: 63, fill: true, color: PALETTE.skinShadow, translate: { y: 6 } });
  bodyUpper.copy({ stroke: 57, color: PALETTE.skin, translate: { x: -3 } });

  const armGroup = new Zdog.Group({ addTo: bodyAnchor, translate: { z: -6 }, rotate: { x: Zdog.TAU / 16 } });
  const arm = new Zdog.Shape({ addTo: armGroup, stroke: 30, color: PALETTE.skinShadow, path: [{ x: -35, y: -6, z: 0 }, { bezier: [{ x: -33, y: -6, z: 0 }, { x: -45, y: -6, z: 0 }, { x: -54, y: 30, z: 0 }] }], closed: false });
  arm.copy({ stroke: 27, color: PALETTE.skin });
  const armLeft = armGroup.copyGraph({ rotate: { x: Zdog.TAU / 16, y: Zdog.TAU / 2 } });
  armLeft.children[1].stroke = 21;
  armLeft.children[1].translate = { x: 1, y: 1 };

  const bodyLowerGroup = new Zdog.Group({ addTo: bodyGroup, translate: { y: 30 } });
  new Zdog.Shape({ addTo: bodyLowerGroup, stroke: 69, fill: true, color: PALETTE.skinShadow, translate: { y: 6 }, path: [{ x: -4.5 }, { x: 4.5 }] }).copy({ stroke: 66, color: PALETTE.skin, translate: { x: -3, y: 4.5 }, path: [{ x: -4.5 }, { x: 4.5 }] });

  const legGroup = new Zdog.Group({ addTo: illo, translate: { y: 141, z: -3 } });
  new Zdog.Shape({ addTo: legGroup, stroke: 28, color: PALETTE.skinShadow, translate: { y: 6 }, path: [{ x: -21, y: -6, z: 0 }, { bezier: [{ x: -18, y: -6, z: 0 }, { x: -24, y: -6, z: 0 }, { x: -24, y: 24, z: 0 }] }], closed: false }).copy({ stroke: 24, color: PALETTE.skin });
  const footGroup = new Zdog.Group({ addTo: legGroup, translate: { x: -25, y: 42, z: 4 }, rotate: { x: Zdog.TAU / 4 } });
  new Zdog.Hemisphere({ addTo: footGroup, stroke: 5, diameter: 23, color: PALETTE.skinShadow, backface: PALETTE.skinShadow }).copy({ diameter: 20, color: PALETTE.skin, backface: PALETTE.skin, translate: { y: -2, z: 2 } });
  const legLeft = legGroup.copyGraph({ rotate: { y: Zdog.TAU / 2 } });
  legLeft.children[1].stroke = 20;
  legLeft.children[1].translate = { x: 1, y: 9 };
  legLeft.children[2].translate = { x: -25, y: 42, z: -4 };

  return { headAnchor, bodyAnchor, bodyUpper, eyeRight: eye, eyeLeft: eyeLeft.children[0] };
}

/* ── 컴포넌트 ── */
export default function InteractiveCharacter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    animationFrameId?: number;
    mouseTimeout?: ReturnType<typeof setTimeout>;
  }>({});

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;
    let scriptsLoaded = 0;

    const initializeAnimation = () => {
      if (!canvasRef.current || !window.Zdog || !window.TweenMax) {
        setTimeout(initializeAnimation, 50);
        return;
      }

      const canvas = canvasRef.current;

      /* 컨테이너 크기로 canvas attribute 초기화 */
      const parent = canvas.parentElement;
      if (parent && parent.offsetWidth > 0) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }

      const { Zdog, TweenMax, TweenLite, Sine } = window;

      const ctx2d = canvas.getContext("2d")!

      const illo = new Zdog.Illustration({
        element: canvas,
        resize: true,
        onResize(this: any, width: number, height: number) {
          this.zoom = Math.min(width, height) / SCENE_SIZE;
        },
        dragRotate: false,
      });

      const model = createCharacterModel(illo);

      /* 호흡 애니메이션 */
      TweenMax.to(model.bodyUpper.scale, 0.5, {
        x: 0.95, y: 0.97, repeat: -1, yoyo: true, ease: Sine.easeInOut,
      });

      /* 눈 깜빡임 */
      const blink = () => {
        const delay = Math.random() * 6 + 2;
        TweenMax.to([model.eyeRight.scale, model.eyeLeft.scale], 0.07, {
          y: 0, repeat: 1, yoyo: true, delay, onComplete: blink,
        });
      };
      blink();

      /* 자연스럽게 두리번 */
      let lookAroundTimeout: ReturnType<typeof setTimeout>;
      const lookAround = () => {
        const randomY = ((Math.random() * 40 - 20) / 360) * Zdog.TAU;
        const dur = Math.random() + 0.5;
        TweenLite.to(model.headAnchor.rotate, dur, { y: randomY, ease: Sine.easeInOut });
        TweenLite.to(model.bodyAnchor.rotate, dur, {
          y: randomY / 2, ease: Sine.easeInOut,
          onComplete: () => { lookAroundTimeout = setTimeout(lookAround, Math.random() * 1000 + 500); },
        });
      };
      lookAround();

      /* 마우스 시선 추적 */
      const watchPlayer = (x: number, y: number) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const rotX = (x - (rect.left + rect.width / 2)) / Zdog.TAU;
        const rotY = -(y - (rect.top + rect.height / 2)) / Zdog.TAU;
        TweenMax.to(model.headAnchor.rotate, 0.5, { x: rotY / 100, y: -rotX / 100, ease: Sine.easeOut });
        TweenMax.to(model.bodyAnchor.rotate, 0.5, { x: rotY / 200, y: -rotX / 200, ease: Sine.easeOut });
      };

      const resetAll = () => {
        TweenLite.to(model.headAnchor.rotate, 0.5, { x: 0, y: 0, ease: Sine.easeOut });
        TweenLite.to(model.bodyAnchor.rotate, 0.5, { x: 0, y: 0, ease: Sine.easeOut });
        lookAround();
      };

      const handleMouseMove = (e: MouseEvent) => {
        TweenLite.killTweensOf(model.headAnchor.rotate);
        TweenLite.killTweensOf(model.bodyAnchor.rotate);
        clearTimeout(lookAroundTimeout);
        watchPlayer(e.clientX, e.clientY);
        clearTimeout(stateRef.current.mouseTimeout);
        stateRef.current.mouseTimeout = setTimeout(resetAll, 2000);
      };

      const handleTouch = (e: TouchEvent) => {
        if (e.touches.length === 0) return;
        const touch = e.touches[0];
        TweenLite.killTweensOf(model.headAnchor.rotate);
        TweenLite.killTweensOf(model.bodyAnchor.rotate);
        clearTimeout(lookAroundTimeout);
        watchPlayer(touch.clientX, touch.clientY);
        clearTimeout(stateRef.current.mouseTimeout);
        stateRef.current.mouseTimeout = setTimeout(resetAll, 2000);
      };

      document.body.addEventListener("mousemove", handleMouseMove);
      // body 레벨 + canvas 레벨 모두 등록 (Zdog dragRotate가 canvas 이벤트를 가로채는 경우 대비)
      document.body.addEventListener("touchstart", handleTouch, { passive: true });
      document.body.addEventListener("touchmove", handleTouch, { passive: true });
      canvas.addEventListener("touchstart", handleTouch, { passive: true });
      canvas.addEventListener("touchmove", handleTouch, { passive: true });

      const animate = () => {
        illo.updateRenderGraph();
        stateRef.current.animationFrameId = requestAnimationFrame(animate);
      };
      animate();

      cleanupFn = () => {
        if (stateRef.current.animationFrameId) cancelAnimationFrame(stateRef.current.animationFrameId);
        document.body.removeEventListener("mousemove", handleMouseMove);
        document.body.removeEventListener("touchstart", handleTouch);
        document.body.removeEventListener("touchmove", handleTouch);
        canvas.removeEventListener("touchstart", handleTouch);
        canvas.removeEventListener("touchmove", handleTouch);
        clearTimeout(lookAroundTimeout);
        if (window.TweenMax) window.TweenMax.killAll();
      };
    };

    /* CDN 스크립트 동적 로드 */
    const scripts = [
      "https://unpkg.com/zdog@1/dist/zdog.dist.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/2.1.3/TweenMax.min.js",
    ];

    scripts.forEach((src) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        scriptsLoaded++;
        if (scriptsLoaded === scripts.length) initializeAnimation();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        scriptsLoaded++;
        if (scriptsLoaded === scripts.length) initializeAnimation();
      };
      document.body.appendChild(script);
    });

    return () => { if (cleanupFn) cleanupFn(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%", background: "transparent", touchAction: "none" }}
    />
  );
}
