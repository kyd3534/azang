"use client";

import { useEffect } from "react";

let _ac: AudioContext | null = null;
let _clickBuf: AudioBuffer | null = null;

function getAC(): AudioContext {
  if (!_ac || _ac.state === "closed") _ac = new AudioContext();
  if (_ac.state === "suspended") _ac.resume();
  return _ac;
}

async function loadClickSound() {
  try {
    const ac = getAC();
    const res = await fetch("/sounds/matthewvakaliuk73627-mouse-click-290204.mp3");
    if (!res.ok) return;
    const arr = await res.arrayBuffer();
    _clickBuf = await ac.decodeAudioData(arr);
  } catch { /* ignore */ }
}

export function playClickSound() {
  const buf = _clickBuf;
  if (!buf) return;
  try {
    const ac = getAC();
    const src = ac.createBufferSource();
    src.buffer = buf;
    const gain = ac.createGain();
    gain.gain.value = 0.6;
    src.connect(gain);
    gain.connect(ac.destination);
    src.start(ac.currentTime);
  } catch { /* ignore */ }
}

export default function ClickSound() {
  useEffect(() => {
    loadClickSound();

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest("[role='button']") ||
        target.closest("[role='tab']") ||
        target.closest("[role='menuitem']")
      ) {
        playClickSound();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, { capture: true });
    return () => document.removeEventListener("pointerdown", handlePointerDown, { capture: true });
  }, []);

  return null;
}
