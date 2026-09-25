"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

/* â”€â”€â”€ Factory token constants â”€â”€â”€ */
const C = {
  canvas: "#101010",
  carbon: "#1d1a18",
  ash: "#3d3a39",
  graphite: "#4d4947",
  granite: "#8a8380",
  stone: "#b8b3b0",
  bone: "#eeeeee",
  chalk: "#fafafa",
  orange: "#ee6018",
  green: "#a0ca92",
};


function ScanPanel() {
  const [cmdText, setCmdText] = useState("");
  const fullCmd = "qualio scan --live acme-saas.com";

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setCmdText(fullCmd.slice(0, i));
      i++;
      if (i > fullCmd.length) clearInterval(timer);
    }, 45); // Typing speed
    return () => clearInterval(timer);
  }, []);

  const rows = [
    { status: "done", icon: "âœ“", label: "acme-saas.com/", ms: "280ms" },
    { status: "done", icon: "âœ“", label: "acme-saas.com/pricing", ms: "312ms" },
    { status: "done", icon: "âœ“", label: "acme-saas.com/features", ms: "298ms" },
    { status: "live", icon: "â—", label: "acme-saas.com/contact", ms: "â€”" },
    { status: "queue", icon: "â—‹", label: "acme-saas.com/login", ms: "â€”" },
    { status: "queue", icon: "â—‹", label: "acme-saas.com/checkout", ms: "â€”" },
  ];
  const checks = [
    { label: "Links checked", value: "24", color: C.green },
    { label: "Buttons clicked", value: "13", color: C.green },
    { label: "Forms tested", value: "4", color: C.orange },
    { label: "Responsive", value: "â€”", color: C.graphite },
  ];
  return (
    <div style={{ background: "#0d0d0d", border: `1px solid ${C.carbon}`, borderRadius: 10, overflow: "hidden" }}>
      {/* Window chrome */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", borderBottom: `1px solid ${C.carbon}` }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.bone, marginLeft: 8, letterSpacing: "-0.02em" }}>
          <span style={{ color: C.orange }}>$</span> {cmdText}
          <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.9 }} style={{ display: "inline-block", width: 6, height: 12, background: C.orange, marginLeft: 4, verticalAlign: "middle" }} />
        </span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.orange, animation: "pulse 1.5s infinite" }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase" }}>Live</span>
        </span>
      </div>
      <div style={{ padding: 16, position: "relative" }}>
        {rows.map((r, i) => (
          <motion.div key={r.label}
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6 + i * 0.12, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "5px 0",
              fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
              color: r.status === "done" ? C.green : r.status === "live" ? C.orange : C.graphite,
              borderBottom: i < rows.length - 1 ? `1px solid ${C.carbon}` : "none",
              letterSpacing: "-0.02em",
              position: "relative", zIndex: 1
            }}
          >
            <span style={{ width: 14, textAlign: "center", flexShrink: 0 }}>
              {r.status === "live" ? (
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ display: "inline-block" }}>{r.icon}</motion.span>
              ) : r.icon}
            </span>
            <span style={{ flex: 1 }}>{r.label}</span>
            <span style={{ color: r.status === "done" ? C.stone : C.graphite }}>{r.ms}</span>
          </motion.div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginTop: 12, background: C.carbon, borderRadius: 3, overflow: "hidden" }}>
          {checks.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2 + i * 0.1, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{ background: "#0d0d0d", padding: "10px 12px" }}
            >
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.graphite, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>{c.label}</div>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 22, fontWeight: 400, color: c.color, letterSpacing: "-0.03em" }}>{c.value}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DiagnosisPanel() {
  return (
    <div style={{ background: "#0d0d0d", border: `1px solid ${C.carbon}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.carbon}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase" }}>â—† AI Diagnosis</span>
        <span style={{
          marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.graphite,
          padding: "2px 7px", border: `1px solid ${C.carbon}`, borderRadius: 3
        }}>Confidence Â· Medium</span>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.carbon}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.orange,
              padding: "2px 8px", background: "rgba(238,96,24,0.08)", border: "1px solid rgba(238,96,24,0.18)", borderRadius: 3,
              letterSpacing: "0.06em", textTransform: "uppercase"
            }}>â— Critical</span>
          </div>
          <h4 style={{
            fontFamily: "'Manrope',sans-serif", fontSize: 15, fontWeight: 400, color: C.bone,
            lineHeight: 1.3, letterSpacing: "-0.02em", margin: "0 0 8px"
          }}>
            Signup button dead click on /pricing
          </h4>
          <p style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: C.granite, lineHeight: 1.5, margin: 0 }}>
            The CTA was clicked but triggered <span style={{ color: C.stone }}>no navigation, modal, or network request</span>.
            Likely cause: missing click handler or silent client-side exception.
          </p>
        </div>
        {[
          ["Impact", "Users cannot initiate signup from /pricing", C.orange],
          ["Page", "/pricing", C.stone],
          ["Element", "Start free trial", C.stone],
          ["Evidence", "Screenshot Â· Network Â· Console error", C.graphite],
        ].map(([k, v, col]) => (
          <div key={k as string} style={{
            display: "flex", gap: 12, padding: "5px 0",
            borderBottom: `1px solid ${C.carbon}`,
            fontFamily: "'JetBrains Mono',monospace", fontSize: 12, letterSpacing: "-0.02em"
          }}>
            <span style={{ color: C.graphite, width: 72, flexShrink: 0 }}>{k as string}</span>
            <span style={{ color: col as string }}>{v as string}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel() {
  const scans = [
    { date: "Sep 20", issues: 8, critical: 3, resolved: 0, regression: 0 },
    { date: "Sep 22", issues: 4, critical: 1, resolved: 4, regression: 1 },
    { date: "Sep 24", issues: 2, critical: 0, resolved: 2, regression: 1 },
  ];
  return (
    <div style={{ background: "#0d0d0d", border: `1px solid ${C.carbon}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{
        padding: "12px 16px", borderBottom: `1px solid ${C.carbon}`,
        fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.graphite,
        letterSpacing: "0.06em", textTransform: "uppercase"
      }}>
        Scan history â€” acme-saas.com
      </div>
      <div style={{ padding: 16 }}>
        {scans.map((s, i) => (
          <motion.div key={s.date}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{
              display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 16,
              padding: "14px 0", borderBottom: i < scans.length - 1 ? `1px solid ${C.carbon}` : "none",
              alignItems: "center"
            }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.stone, letterSpacing: "-0.02em" }}>{s.date}</span>
            <div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {s.resolved > 0 && (
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.green,
                    padding: "2px 6px", background: "rgba(160,202,146,0.08)", border: "1px solid rgba(160,202,146,0.18)", borderRadius: 3
                  }}>
                    âœ“ {s.resolved} resolved
                  </span>
                )}
                {s.regression > 0 && (
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.orange,
                    padding: "2px 6px", background: "rgba(238,96,24,0.08)", border: "1px solid rgba(238,96,24,0.18)", borderRadius: 3
                  }}>
                    â†‘ {s.regression} new
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{
                fontFamily: "'Manrope',sans-serif", fontSize: 24, fontWeight: 400,
                color: s.critical > 0 ? C.orange : C.green, letterSpacing: "-0.03em"
              }}>{s.issues}</span>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.graphite, letterSpacing: "0.04em", textTransform: "uppercase" }}>issues</div>
            </div>
          </motion.div>
        ))}
        <div style={{
          marginTop: 16, padding: "12px", background: C.carbon, borderRadius: 3,
          display: "flex", alignItems: "center", gap: 8
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: C.granite }}>
            2 issues resolved since last scan Â· 0 regressions
          </span>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ HERO â”€â”€â”€ */
export function Hero() {
  const { t } = useLanguage();
  const hero = t.hero;

  const [activeTab, setActiveTab] = useState(0);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = ref.current?.querySelectorAll<HTMLElement>("[data-a]");
    els?.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(18px)";
      setTimeout(() => {
        el.style.transition = "opacity 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1)";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, 60 + i * 100);
    });
  }, []);

  const tabs = [
    {
      id: "scan",
      label: hero.tabs.scan.label,
      icon: "â¬¡",
      title: hero.tabs.scan.desc,
      sub: hero.tabs.scan.sub,
      panel: <ScanPanel />,
    },
    {
      id: "diagnose",
      label: hero.tabs.diagnosis.label,
      icon: "â—†",
      title: hero.tabs.diagnosis.desc,
      sub: hero.tabs.diagnosis.sub,
      panel: <DiagnosisPanel />,
    },
    {
      id: "history",
      label: hero.tabs.history.label,
      icon: "â—Ž",
      title: hero.tabs.history.desc,
      sub: hero.tabs.history.sub,
      panel: <HistoryPanel />,
    },
  ];

  const tab = tabs[activeTab] || tabs[0];

  return (
    <section ref={ref} id="top" className="hero-section" style={{
      background: C.canvas,
      display: "flex", flexDirection: "column", alignItems: "center",
      paddingTop: 140, paddingBottom: 60, position: "relative",
    }}>


      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px", width: "100%", position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* CENTERED TEXT BLOCK */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center", marginBottom: 70 }}>

            {/* Eyebrow - ANIMATED (Hover Arrow) */}
            <motion.div data-a
              whileHover="hover"
              initial="rest"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: C.carbon,
                border: `1px solid ${C.ash}`,
                padding: "5px 12px", borderRadius: 8, width: "fit-content",
                cursor: "pointer"
              }}
            >
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 500,
                letterSpacing: "0.06em", textTransform: "uppercase", color: C.bone
              }}>
                {hero.badge}
              </span>
              <motion.span
                variants={{
                  rest: { x: 0, color: C.granite },
                  hover: { x: 4, color: C.orange }
                }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                style={{ display: "flex", alignItems: "center" }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.span>
            </motion.div>

            {/* Headline â€” Grand & Bold SaaS Presence */}
            <h1 data-a style={{
              fontFamily: "'Manrope',sans-serif",
              fontSize: "clamp(42px,5.5vw,72px)", fontWeight: 400,
              lineHeight: 1.05, letterSpacing: "-0.04em", color: C.bone, margin: 0,
              textShadow: "0 4px 24px rgba(0,0,0,0.5)"
            }}>
              {hero.titleStart} <span style={{ color: C.orange }}>{hero.titleHighlight}</span>
            </h1>

            {/* Body */}
            <p data-a style={{
              fontFamily: "'Manrope',sans-serif",
              fontSize: 18, fontWeight: 400, lineHeight: 1.6, color: C.bone,
              opacity: 0.8, maxWidth: 540, margin: "0 auto",
              textShadow: "0 2px 12px rgba(0,0,0,0.5)"
            }}>
              {hero.description}
            </p>

            {/* CTAs */}
            <div data-a style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 4 }}>
              <motion.a
                href="/login?mode=register"
                whileHover="hover"
                initial="rest"
                style={{
                  position: "relative",
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: C.bone, color: C.canvas, borderRadius: 8,
                  padding: "12px 24px", fontSize: 13, fontWeight: 600,
                  lineHeight: 1, whiteSpace: "nowrap", textDecoration: "none",
                  cursor: "pointer", overflow: "hidden",
                  boxShadow: `0 0 0 1px ${C.bone}, 0 8px 24px -4px rgba(255, 255, 255, 0.15)`
                }}
              >
                {/* Animated light beam sweep */}
                <motion.div
                  variants={{
                    rest: { left: "-100%" },
                    hover: { left: "100%" }
                  }}
                  transition={{ duration: 0.55, ease: "easeInOut" }}
                  style={{
                    position: "absolute", top: 0, bottom: 0, width: "25%",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
                    transform: "skewX(-20deg)", zIndex: 0
                  }}
                />
                <span style={{ position: "relative", zIndex: 1 }}>{hero.ctaPrimary}</span>
                <motion.span
                  variants={{
                    rest: { x: 0 },
                    hover: { x: 4 }
                  }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  style={{ display: "flex", alignItems: "center", position: "relative", zIndex: 1 }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              </motion.a>

            </div>

            {/* Solution 1: Sleek Linear/Raycast-style Reassurance Bar */}
            <div data-a className="hero-stats-bar" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "nowrap",
              whiteSpace: "nowrap",
              paddingTop: 14, marginTop: 12, borderTop: `1px solid rgba(255,255,255,0.1)`,
              fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
              letterSpacing: "0.02em", color: "rgba(255,255,255,0.6)",
            }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
                <span>
                  <strong style={{ color: C.bone, fontWeight: 500, fontFamily: "'Manrope',sans-serif", fontSize: 13 }}>
                    {hero.stats.checks.value}
                  </strong>{" "}
                  {hero.stats.checks.label}
                </span>
              </div>
              <span style={{ color: C.ash, opacity: 0.6 }}>/</span>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.orange, flexShrink: 0 }} />
                <span>
                  <strong style={{ color: C.bone, fontWeight: 500, fontFamily: "'Manrope',sans-serif", fontSize: 13 }}>
                    {hero.stats.speed.value}
                  </strong>{" "}
                  {hero.stats.speed.label}
                </span>
              </div>
              <span style={{ color: C.ash, opacity: 0.6 }}>/</span>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
                <span>
                  <strong style={{ color: C.bone, fontWeight: 500, fontFamily: "'Manrope',sans-serif", fontSize: 13 }}>
                    {hero.stats.sdk.value}
                  </strong>{" "}
                  {hero.stats.sdk.label}
                </span>
              </div>
            </div>
          </div>

          {/* DASHBOARD PREVIEW â€” Landscape & Overlapping */}
          <div className="hero-dash" style={{ position: "relative", width: "100%", maxWidth: 1040, zIndex: 3, marginBottom: 48 }}>
            {/* Ambient backlight glow */}
            <div style={{
              position: "absolute",
              top: -60,
              left: "5%",
              right: "5%",
              height: 260,
              background: "radial-gradient(ellipse 70% 55% at 50% 25%, rgba(238, 96, 24, 0.28) 0%, rgba(238, 96, 24, 0.08) 50%, transparent 75%)",
              filter: "blur(60px)",
              pointerEvents: "none",
              zIndex: 0,
            }} />

            <div data-a style={{
              position: "relative",
              borderRadius: 20,
              boxShadow: "0 0 50px -10px rgba(238, 96, 24, 0.3), 0 32px 80px -12px rgba(0,0,0,0.95)",
              zIndex: 1,
            }}>
              
              {/* Impeccable Overdrive: Diffused Outer Glow for the beam */}
              <div style={{
                position: "absolute",
                inset: -4,
                borderRadius: 24,
                overflow: "hidden",
                zIndex: -1,
                filter: "blur(14px)",
                opacity: 0.8,
                pointerEvents: "none",
              }}>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                  style={{
                    position: "absolute",
                    top: "-150%", left: "-150%", right: "-150%", bottom: "-150%",
                    background: `conic-gradient(from 0deg, transparent 0%, transparent 75%, rgba(238, 96, 24, 0.6) 85%, #ff8c42 95%, rgba(255, 200, 160, 1) 100%)`,
                  }}
                />
              </div>

              {/* Impeccable Animate: Sharp Inner Border Beam */}
              <div style={{
                position: "absolute",
                inset: 0,
                borderRadius: 20,
                background: "rgba(255, 255, 255, 0.05)", // Static fallback border
                overflow: "hidden",
                zIndex: 0,
                pointerEvents: "none",
              }}>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                  style={{
                    position: "absolute",
                    top: "-150%", left: "-150%", right: "-150%", bottom: "-150%",
                    background: `conic-gradient(from 0deg, transparent 0%, transparent 75%, rgba(238, 96, 24, 0.4) 85%, #ff8c42 95%, rgba(255, 200, 160, 1) 100%)`,
                  }}
                />
              </div>

              {/* The inner dashboard */}
              <div style={{
                position: "relative",
                margin: 1, // Creates the 1px border space exposing the beam layer behind
                display: "flex", flexDirection: "column", gap: 0,
                background: "linear-gradient(180deg, #131110 0%, #0d0d0d 35%, #0a0a0a 100%)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                borderRadius: 19,
                boxShadow: "inset 0 1px 0 rgba(255, 220, 190, 0.1), inset 0 20px 40px -20px rgba(238, 96, 24, 0.1)",
                overflow: "hidden",
                zIndex: 1,
              }}>
                {/* Window chrome header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "14px 16px",
                  background: "rgba(0,0,0,0.2)", borderBottom: `1px solid ${C.carbon}`
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
                  <span style={{
                    marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                    color: C.graphite, letterSpacing: "0.06em", textTransform: "uppercase"
                  }}>
                    qualio / dashboard
                  </span>
                </div>

                {/* Icon rail / tab bar */}
                <div style={{
                  display: "flex", background: "transparent",
                  borderBottom: `1px solid rgba(255, 255, 255, 0.05)`,
                }}>
                  {tabs.map((t, i) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(i)}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "12px", background: "transparent", border: "none",
                        borderBottom: activeTab === i ? `2px solid ${C.orange}` : "2px solid transparent",
                        color: activeTab === i ? C.bone : C.graphite,
                        fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                        letterSpacing: "0.06em", textTransform: "uppercase",
                        cursor: "pointer",
                        transition: "color 0.15s ease, border-color 0.15s ease",
                      }}
                    >
                      <span style={{ color: activeTab === i ? C.orange : C.graphite }}>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Animated tab content */}
                <div style={{ padding: 24, minHeight: 380 }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                      {/* Tab copy */}
                      <div style={{ marginBottom: 20 }}>
                        <h3 style={{
                          fontFamily: "'Manrope',sans-serif", fontSize: 20, fontWeight: 400,
                          lineHeight: 1.2, letterSpacing: "-0.025em", color: C.bone,
                          margin: "0 0 8px", whiteSpace: "pre-line",
                        }}>{tab.title}</h3>
                        <p style={{
                          fontFamily: "'Manrope',sans-serif", fontSize: 13,
                          color: C.granite, lineHeight: 1.5, margin: 0
                        }}>{tab.sub}</p>
                      </div>
                      {tab.panel}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

      <style>{`
        .hero-section { min-height: auto; }
        @media (max-width: 1023px) {
          .hero-section { min-height: auto; padding-top: 130px !important; }
        }
        @media (max-width: 640px) {
          .hero-stats-bar { flex-wrap: wrap !important; gap: 8px 12px !important; }
          .hero-dash { display: none !important; } /* Hide complex dashboard preview on very small mobile to save space, or scale it down */
        }
        @keyframes pulse-dot {
          0%, 100% { opacity:1; transform:scale(1); }
          50% { opacity:0.4; transform:scale(0.8); }
        }
        @keyframes pulse {
          0%, 100% { opacity:1; }
          50% { opacity:0.4; }
        }
      `}</style>
    </section>
  );
}
