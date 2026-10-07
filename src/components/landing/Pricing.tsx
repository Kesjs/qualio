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

  return (
    <section id="pricing" style={{ background: C.canvas, padding: "96px 0" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px" }}>
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

        <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16 }}>
          {t.plans.map((plan, index) => (
            (() => {
              const highlighted = "highlighted" in plan && plan.highlighted === true;
              return (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.06 * index, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: "relative",
                background: C.carbon,
                border: `1px solid ${highlighted ? C.orange : C.graphite}`,
                borderRadius: 10,
                padding: "28px 22px",
                display: "flex",
                flexDirection: "column",
              }}>
              {highlighted ? (
                <span style={{ position: "absolute", top: -11, left: 22, background: C.orange, color: C.canvas, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 999 }}>
                  {t.mostPopularBadge}
                </span>
              ) : null}

              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: highlighted ? C.orange : C.granite, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>{plan.label}</div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 36, color: C.bone, letterSpacing: "-0.03em", lineHeight: 1 }}>{plan.price}</span>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: C.granite }}>{plan.period}</span>
              </div>

              <p style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: C.granite, lineHeight: 1.6, margin: "0 0 20px", minHeight: 36 }}>{plan.desc}</p>

              <div style={{ display: "grid", gap: 10, marginBottom: 24, flex: 1 }}>
                {plan.features.map((feature) => (
                  <div key={feature} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontFamily: "'Manrope',sans-serif", fontSize: 13, color: C.stone, lineHeight: 1.4 }}>
                    <span style={{ color: C.green, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>✓</span>{feature}
                  </div>
                ))}
              </div>

              <a href="/login?mode=register" style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: highlighted ? C.orange : "transparent",
                border: highlighted ? "none" : `1px solid ${C.graphite}`,
                color: highlighted ? C.canvas : C.bone,
                padding: "10px 16px", borderRadius: 6, textDecoration: "none",
                fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 600,
              }}>
                {plan.cta} <span aria-hidden="true">→</span>
              </a>
            </motion.div>
              );
            })()
          ))}
        </div>

        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.granite, letterSpacing: "0.04em", textAlign: "center", marginTop: 32 }}>{t.footerNote}</p>
      </div>
      <style>{`.pricing-grid { grid-template-columns: repeat(4,minmax(0,1fr)); } @media (max-width: 920px) { .pricing-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } } @media (max-width: 560px) { .pricing-grid { grid-template-columns: 1fr; } }`}</style>
    </section>
  );
}
