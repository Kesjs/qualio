"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";

const C = {
  canvas: "#000000", carbon: "#141414", graphite: "#262626",
  granite: "#8a8380", stone: "#b8b3b0", bone: "#eeeeee",
  orange: "#ee6018", green: "#a0ca92",
};

export function Pricing() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { language } = useLanguage();
  const t = translations[language].pricing;
  const plan = t.plans[0];
  const included = [
    t.planValues.site,
    t.planValues.browserScan,
    t.planValues.aiDiagnosis,
    t.planValues.evidence,
    t.planValues.fixPrompt,
    t.planValues.scanHistory,
  ];

  return (
    <section id="pricing" style={{ background: C.canvas, padding: "96px 0" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 24px" }}>
        <motion.div ref={ref} initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }} style={{ marginBottom: 48, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.orange }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: C.orange }}>{t.badge}</span>
          </div>
          <h2 style={{ fontFamily: "'Manrope',sans-serif", fontSize: "clamp(32px,4vw,44px)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.025em", color: C.bone, margin: 0 }}>
            {t.titleStart}<br /><span style={{ color: C.granite }}>{t.titleHighlight}</span>
          </h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.08, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{ background: C.carbon, border: `1px solid ${C.graphite}`, borderRadius: 10, padding: "clamp(24px,5vw,48px)", display: "grid", gap: 36 }}
          className="early-access-grid">
          <div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>{plan.label}</div>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: "clamp(34px,5vw,52px)", color: C.bone, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 14 }}>{t.accessLabel}</div>
            <p style={{ fontFamily: "'Manrope',sans-serif", fontSize: 15, color: C.granite, lineHeight: 1.6, margin: "0 0 24px", maxWidth: 420 }}>{plan.desc}</p>
            <a href="/login?mode=register" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.bone, color: C.canvas, padding: "11px 20px", borderRadius: 4, textDecoration: "none", fontFamily: "'Manrope',sans-serif", fontSize: 14, fontWeight: 600 }}>
              {plan.cta} <span aria-hidden="true">→</span>
            </a>
          </div>
          <div style={{ display: "grid", alignContent: "center" }}>
            {included.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${C.graphite}`, color: C.stone, fontFamily: "'Manrope',sans-serif", fontSize: 14 }}>
                <span style={{ color: C.green, fontFamily: "'JetBrains Mono',monospace" }}>✓</span>{item}
              </div>
            ))}
          </div>
        </motion.div>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.granite, letterSpacing: "0.04em", textAlign: "center", marginTop: 24 }}>{t.footerNote}</p>
      </div>
      <style>{`.early-access-grid { grid-template-columns: 1fr 1fr; } @media (max-width: 720px) { .early-access-grid { grid-template-columns: 1fr; } }`}</style>
    </section>
  );
}
