"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            textAlign: "center",
            padding: "2rem",
            fontFamily: "sans-serif",
            background: "#fbfbfa",
          }}
        >
          <p style={{ fontSize: "4rem", marginBottom: "1rem" }}>🙈</p>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#374151", marginBottom: "0.5rem" }}>
            앗! 뭔가 잘못됐어요
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginBottom: "1.5rem" }}>
            {error.message || "잠시 후 다시 시도해 주세요."}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "1rem",
              fontWeight: 900,
              color: "white",
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, #FF8A50, #FF5722)",
            }}
          >
            다시 시도하기 🔄
          </button>
        </div>
      </body>
    </html>
  );
}
