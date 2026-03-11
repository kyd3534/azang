"use client";

import dynamic from "next/dynamic";

const FairyCharacter = dynamic(() => import("./fairy-character"), {
  ssr: false,
  loading: () => (
    <div style={{ width: 280, height: 340, borderRadius: 24, background: "linear-gradient(145deg,#e8f4ff,#f0e8ff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: 48 }}>🧚</span>
    </div>
  ),
});

export default FairyCharacter;
