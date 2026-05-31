"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9f9fb",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "480px",
            margin: "0 auto",
            padding: "48px 32px",
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            boxShadow:
              "0 4px 6px -1px rgba(0,0,0,0.07), 0 24px 48px -8px rgba(0,0,0,0.1)",
            textAlign: "center",
          }}
        >
          {/* Error icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "#fff0f5",
              margin: "0 auto 24px",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              width="36"
              height="36"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#ff4f86"
                strokeWidth="2"
              />
              <line
                x1="12"
                y1="8"
                x2="12"
                y2="12"
                stroke="#ff4f86"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="16"
                x2="12.01"
                y2="16"
                stroke="#ff4f86"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h1
            style={{
              margin: "0 0 12px",
              fontSize: "22px",
              fontWeight: "800",
              color: "#1a1a2e",
              lineHeight: "1.3",
            }}
          >
            Something went seriously wrong
          </h1>

          <p
            style={{
              margin: "0 0 32px",
              fontSize: "15px",
              color: "#6b7280",
              lineHeight: "1.6",
            }}
          >
            A critical error occurred and the application could not continue.
            Please try refreshing the page.
          </p>

          {process.env.NODE_ENV === "development" && error?.message && (
            <pre
              style={{
                margin: "0 0 24px",
                padding: "12px 16px",
                backgroundColor: "#f3f4f6",
                borderRadius: "8px",
                fontSize: "11px",
                color: "#6b7280",
                textAlign: "left",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {error.message}
            </pre>
          )}

          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "160px",
              padding: "12px 28px",
              backgroundColor: "#ff4f86",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 14px 32px rgba(255,79,134,0.28)",
              transition: "opacity 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
