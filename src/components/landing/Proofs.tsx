"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

const C = {
  canvas: "#000000",
  carbon: "#141414",
  granite: "#8a8380",
  stone: "#b8b3b0",
  bone: "#eeeeee",
  orange: "#ee6018",
  green: "#a0ca92",
};

export function Proofs() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { t } = useLanguage();

  return (
    <section id="proofs" style={{ background: C.canvas, padding: "40px 0 96px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1, background: C.carbon, border: `1px solid ${C.carbon}`, borderRadius: 10, overflow: "hidden" }}
          className="proofs-grid"
        >
          {[t.proofs.detect, t.proofs.receive].map((column) => (
            <div key={column.title} style={{ background: C.canvas, padding: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.orange }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.orange, letterSpacing: "0.08em", textTransform: "uppercase" }}>{column.eyebrow}</span>
              </div>
              <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.03em", color: C.bone, margin: "0 0 12px" }}>{column.title}</h2>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, color: C.granite, lineHeight: 1.6, margin: "0 0 24px", maxWidth: 470 }}>{column.description}</p>
              <div style={{ display: "grid", gap: 1, background: C.carbon }}>
                {column.items.map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, background: C.canvas, padding: "12px 14px", fontFamily: "'Manrope', sans-serif", fontSize: 13, color: C.stone }}>
                    <span style={{ color: C.green, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
      <style>{`
        @media (max-width: 720px) {
          .proofs-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
