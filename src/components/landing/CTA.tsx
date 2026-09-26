"use client";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const C = {
  canvas: "#000000",
  carbon: "#141414",
  ash: "#1a1a1a",
  graphite: "#262626",
  granite: "#8a8380",
  stone: "#b8b3b0",
  bone: "#eeeeee",
  chalk: "#fafafa",
  orange: "#ee6018",
  green: "#a0ca92",
};

export function CTA() {
  const { t } = useLanguage();
  const cta = t.cta;
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const handleScan = async () => {
    if (!url) return;
    setState("loading");
    
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      
      sessionStorage.setItem("qualio_pending_url", url);
      
      if (data.session) {
        router.push(`/dashboard?newUrl=${encodeURIComponent(url)}`);
      } else {
        router.push(`/login?mode=register&url=${encodeURIComponent(url)}`);
      }
    } catch (e) {
      console.error(e);
      setState("idle");
    }
  };

  return (
    <section id="cta" style={{ background: C.canvas, padding: "96px 0 80px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* Main CTA card — light on dark, Factory signature */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="cta-card"
          style={{
            background: C.bone,
            color: C.canvas,
            borderRadius: 10,
            display: "grid",
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Grain overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Left copy */}
          <div style={{ position: "relative" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 11,
                color: C.orange,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: C.orange,
                  animation: "pulse 2s infinite",
                }}
              />
              {cta.badge}
            </span>
            <h2
              style={{
                fontFamily: "'Manrope',sans-serif",
                fontSize: "clamp(32px,4vw,44px)",
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: "-0.025em",
                color: C.canvas,
                margin: "0 0 16px",
              }}
            >
              {cta.titleStart}
              <br />
              {cta.titleHighlight}
            </h2>
            <p
              style={{
                fontFamily: "'Manrope',sans-serif",
                fontSize: 16,
                fontWeight: 400,
                lineHeight: 1.6,
                color: C.graphite,
                margin: "0 0 32px",
                maxWidth: 420,
              }}
            >
              {cta.description}
            </p>

            {/* Stats */}
            <div
              className="cta-stats-row"
              style={{
                display: "flex",
                gap: 32,
                paddingTop: 24,
                borderTop: `1px solid rgba(0,0,0,0.08)`,
              }}
            >
              {cta.stats.map((s) => (
                <div key={s.label}>
                  <div
                    style={{
                      fontFamily: "'Manrope',sans-serif",
                      fontSize: 24,
                      fontWeight: 400,
                      color: C.canvas,
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                      color: C.graphite,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginTop: 4,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right â€” URL scan form */}
          <div style={{ position: "relative" }}>
            <div
              className="cta-form-box"
              style={{
                background: C.canvas,
                borderRadius: 10,
                padding: 32,
                border: `1px solid ${C.carbon}`,
              }}
            >
              {/* Window chrome */}
              <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }} />
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e" }} />
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840" }} />
              </div>

              <label
                style={{
                  display: "block",
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  color: C.graphite,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {cta.inputLabel}
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <input
                  type="url"
                  placeholder={cta.inputPlaceholder}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                  style={{
                    flex: 1,
                    background: C.carbon,
                    border: `1px solid ${C.ash}`,
                    borderRadius: 3,
                    padding: "9px 12px",
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 13,
                    color: C.bone,
                    letterSpacing: "-0.02em",
                    outline: "none",
                  }}
                />
              </div>

              {/* Check toggles */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 20 }}>
                {cta.checks.map((c) => (
                  <label
                    key={c}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontFamily: "'Manrope',sans-serif",
                      fontSize: 12,
                      color: C.granite,
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        border: `1px solid ${C.ash}`,
                        background: C.green,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path
                          d="M1.5 4l2 2L6.5 2"
                          stroke={C.canvas}
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    {c}
                  </label>
                ))}
              </div>

              <button
                onClick={handleScan}
                disabled={!url || state === "loading"}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: 3,
                  border: "none",
                  background: !url || state === "loading" ? C.ash : C.chalk,
                  color: !url || state === "loading" ? C.graphite : C.canvas,
                  fontFamily: "'Manrope',sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: !url || state === "loading" ? "not-allowed" : "pointer",
                  transition: "background 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {state === "loading" ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        border: `2px solid ${C.graphite}`,
                        borderTopColor: C.stone,
                        borderRadius: "50%",
                      }}
                    />
                    {cta.buttonLoading}
                  </>
                ) : state === "done" ? (
                  <>
                    <span style={{ color: C.green }}>âœ“</span> {cta.buttonDone}
                  </>
                ) : (
                  <>{cta.buttonIdle}</>
                )}
              </button>

              <p
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  color: C.graphite,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  textAlign: "center",
                  marginTop: 12,
                }}
              >
                {cta.caption}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      <style>{`
        @media (min-width: 1024px) {
          .cta-card { grid-template-columns: 1fr 1fr; padding: 64px; gap: 64px; }
        }
        @media (max-width: 1023px) {
          .cta-card { grid-template-columns: 1fr; padding: 40px 24px; gap: 40px; }
        }
        @media (max-width: 640px) {
          .cta-card { padding: 28px 18px !important; gap: 28px !important; }
          .cta-stats-row { flex-wrap: wrap !important; gap: 16px 24px !important; }
          .cta-form-box { padding: 20px 16px !important; }
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </section>
  );
}
