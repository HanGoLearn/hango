"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/client-error-reporting";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError("react_boundary", error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <main
          role="alert"
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "#12100d",
            color: "#f7f1e8",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ maxWidth: "520px" }}>
            <h1>HanGo no pudo cargar</h1>
            <p>El problema quedó registrado. Inténtalo otra vez.</p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "16px",
                border: 0,
                borderRadius: "10px",
                padding: "12px 18px",
                background: "#d32743",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Intentar de nuevo / Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
