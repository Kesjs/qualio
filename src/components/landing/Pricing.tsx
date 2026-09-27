"use client";
import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";

const C = { canvas:"#000000", carbon:"#141414", ash:"#1a1a1a", graphite:"#262626",
  granite:"#8a8380", stone:"#b8b3b0", bone:"#eeeeee", chalk:"#fafafa", orange:"#ee6018", green:"#a0ca92" };

const PLAN_MODELS = [
  { id: "free", price: { monthly: 0, annual: 0 }, ctaStyle: "ghost" },
  { id: "pro", price: { monthly: 29, annual: 23 }, ctaStyle: "light", highlight: true },
  { id: "team", price: { monthly: 79, annual: 63 }, ctaStyle: "dark" },
];

function Check({ active }: { active: boolean }) {
  return active ? (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="#a0ca92" strokeWidth="1"/>
      <path d="M4.5 7l2 2L9.5 5" stroke="#a0ca92" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="#1a1a1a" strokeWidth="1"/>
      <path d="M5 9l4-4M9 9L5 5" stroke="#262626" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function InfoTooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex", cursor: "help" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(!show)}
    >
      <span style={{
        textDecoration: "underline dotted",
        textUnderlineOffset: 3,
        textDecorationColor: C.granite,
      }}>
        {children}
      </span>
      {show && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)", background: C.canvas, color: C.bone,
          padding: "10px 14px", borderRadius: 6, fontSize: 12, lineHeight: 1.4,
          width: 220, textAlign: "left", zIndex: 20,
          fontFamily: "'Manrope',sans-serif", fontWeight: 400,
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          border: `1px solid ${C.carbon}`,
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once:true, margin:"-80px" });

  const { language } = useLanguage();
  const t = translations[language].pricing;

  // Build the feature matrix dynamically from translated values
  const featureMatrix = [
    { key: t.planFeatures.sites,         vals: ["1", "5", t.planValues.unlimited] },
    { key: t.planFeatures.scansPerMonth, vals: ["5", t.planValues.unlimited, t.planValues.unlimited] },
    { key: t.planFeatures.pagesPerScan,  vals: ["10", "100", t.planValues.unlimited] },
    { key: t.planFeatures.aiDiagnosis,   vals: [t.planValues.aiBasic, t.planValues.aiFull, t.planValues.aiFullPlus] },
    { key: t.planFeatures.evidence,      vals: [t.planValues.evidenceBasic, t.planValues.evidenceFull, t.planValues.evidenceVideo], tooltip: t.planFeatures.evidenceTooltip },
    { key: t.planFeatures.report,        vals: [t.planValues.reportNone, t.planValues.reportShareable, t.planValues.reportBranded], tooltip: t.planFeatures.reportTooltip },
    { key: t.planFeatures.beforeAfter,   vals: [false, true, true], tooltip: t.planFeatures.beforeAfterTooltip },
    { key: t.planFeatures.history,       vals: [t.planValues.historyStarter, t.planValues.historyPro, t.planValues.historyTeam] },
    { key: t.planFeatures.integrations,  vals: [false, "Slack, GitHub", "Slack, GitHub, Jira, PagerDuty"] },
    { key: t.planFeatures.prioritySupport,vals: [false, false, t.planValues.supportTeam] },
  ];

  return (
    <section id="pricing" style={{ background:C.canvas, padding:"96px 0" }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px" }}>

        {/* Header */}
        <div ref={ref} style={{ marginBottom:56, display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:24 }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:16 }}>
              <span style={{ width:6,height:6,borderRadius:"50%",background:C.orange }}/>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:12,
                letterSpacing:"0.08em",textTransform:"uppercase",color:C.orange }}>{t.badge}</span>
            </div>
            <h2 style={{ fontFamily:"'Manrope',sans-serif",
              fontSize:"clamp(32px,4vw,44px)",fontWeight:400,
              lineHeight:1.1,letterSpacing:"-0.025em",color:C.bone,margin:0 }}>
              {t.titleStart}<br/>
              <span style={{ color:C.granite }}>{t.titleHighlight}</span>
            </h2>
          </div>

          {/* Toggle */}
          <div style={{
            display: "flex", alignItems: "center", background: "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${C.carbon}`, borderRadius: 100, padding: 4,
            position: "relative",
          }}>
            <button
              onClick={() => setAnnual(false)}
              style={{
                position: "relative", zIndex: 1, padding: "8px 20px", background: "transparent",
                border: "none", cursor: "pointer", outline: "none",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 500,
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: !annual ? C.canvas : C.stone,
                transition: "color 0.2s ease",
              }}
            >
              {t.toggleMonthly}
              {!annual && (
                <motion.div
                  layoutId="pricing-toggle-bg"
                  style={{
                    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                    background: C.bone, borderRadius: 100, zIndex: -1,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
            </button>

            <button
              onClick={() => setAnnual(true)}
              style={{
                position: "relative", zIndex: 1, padding: "8px 20px", background: "transparent",
                border: "none", cursor: "pointer", outline: "none", display: "flex", alignItems: "center", gap: 6,
                fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 500,
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: annual ? C.canvas : C.stone,
                transition: "color 0.2s ease",
              }}
            >
              {t.toggleAnnual}
              {annual && (
                <motion.div
                  layoutId="pricing-toggle-bg"
                  style={{
                    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                    background: C.bone, borderRadius: 100, zIndex: -1,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="pricing-grid" style={{ display:"grid", gap:1,
          background:C.carbon, border:`1px solid ${C.carbon}`, borderRadius:10, overflow:"hidden" }}>
          {t.plans.map((planText, i) => {
            const planModel = PLAN_MODELS[i];
            return (
            <motion.div
              key={planModel.id}
              initial={{ opacity:0, y:24 }}
              animate={inView?{opacity:1,y:0}:{}}
              transition={{ delay:i*0.1, duration:0.5, ease:[0.4,0,0.2,1] }}
              className="pricing-card"
              style={{
                background: planModel.highlight ? C.bone : C.canvas,
                color: planModel.highlight ? C.canvas : C.bone,
                padding:32, display:"flex", flexDirection:"column", gap:24,
              }}
            >
              {/* Plan header */}
              <div>
                {planModel.highlight && (
                  <span style={{ display:"inline-block",
                    fontFamily:"'JetBrains Mono',monospace",fontSize:10,
                    color:C.orange,letterSpacing:"0.08em",textTransform:"uppercase",
                    padding:"2px 8px",background:"rgba(238,96,24,0.1)",
                    border:"1px solid rgba(238,96,24,0.2)",borderRadius:3,marginBottom:12 }}>
                    {t.mostPopularBadge}
                  </span>
                )}
                <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,
                  color: planModel.highlight ? C.graphite : C.orange,
                  letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8 }}>
                  {planText.label}
                </div>

                {/* Animated price */}
                <div style={{ display:"flex",alignItems:"flex-end",gap:4,marginBottom:6 }}>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={annual?"ann":"mon"}
                      initial={{ opacity:0, y:8 }}
                      animate={{ opacity:1, y:0 }}
                      exit={{ opacity:0, y:-8 }}
                      transition={{ duration:0.2, ease:[0.4,0,0.2,1] }}
                      style={{ fontFamily:"'Manrope',sans-serif",fontSize:44,fontWeight:400,
                        letterSpacing:"-0.04em",lineHeight:1,
                        color: planModel.highlight ? C.canvas : C.bone }}
                    >
                      {planModel.price.monthly === 0 ? "Free" : `$${annual ? planModel.price.annual : planModel.price.monthly}`}
                    </motion.span>
                  </AnimatePresence>
                  {planModel.price.monthly > 0 && (
                    <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,
                      color: planModel.highlight ? C.graphite : C.granite,
                      letterSpacing:"0.06em",textTransform:"uppercase",paddingBottom:6 }}>
                      /mo
                    </span>
                  )}
                </div>
                <p style={{ fontFamily:"'Manrope',sans-serif",fontSize:13,
                  color: planModel.highlight ? C.granite : C.granite, lineHeight:1.5, margin:0 }}>
                  {planText.desc}
                </p>
              </div>

              {/* CTA */}
              <a href="/login?mode=register" style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                padding:"10px 20px", borderRadius:3,
                fontFamily:"'Manrope',sans-serif", fontSize:14, fontWeight: planModel.ctaStyle==="light"?500:400,
                lineHeight:1, cursor:"pointer", textDecoration:"none",
                ...(planModel.ctaStyle === "light"
                  ? { background:C.canvas, color:C.bone, border:`1px solid ${C.carbon}` }
                  : planModel.ctaStyle === "ghost"
                  ? { background:"transparent", color:C.bone, border:`1px solid ${C.ash}` }
                  : { background:C.carbon, color:C.bone, border:`1px solid ${C.ash}` }),
                transition:"background 0.15s ease, transform 0.15s ease",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform="translateY(-1px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform="translateY(0)"; }}
              >
                {planText.cta}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>

              {/* Feature list */}
              <div style={{ flex:1 }}>
                {featureMatrix.map(f => {
                  const isEvidenceRow = f.key === t.planFeatures.evidence;
                  const isReportRow = f.key === t.planFeatures.report;
                  const isBeforeAfterRow = f.key === t.planFeatures.beforeAfter;
                  const showValueTooltip = isEvidenceRow && i === 2 && f.tooltip;
                  const showLabelTooltip = (isReportRow || isBeforeAfterRow) && f.tooltip;
                  return (
                    <div key={f.key} style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"7px 0",
                      borderBottom:`1px solid ${planModel.highlight ? "rgba(0,0,0,0.06)" : C.carbon}`,
                      gap:12,
                    }}>
                      <span style={{ fontFamily:"'Manrope',sans-serif",fontSize:13,fontWeight:400,
                        color: planModel.highlight ? C.graphite : C.granite }}>
                        {showLabelTooltip ? (
                          <InfoTooltip text={f.tooltip as string}>{f.key}</InfoTooltip>
                        ) : (
                          f.key
                        )}
                      </span>
                      <span style={{
                        fontFamily:"'JetBrains Mono',monospace",fontSize:12,
                        color: typeof f.vals[i] === "string"
                          ? (planModel.highlight ? C.canvas : C.stone)
                          : "transparent",
                        letterSpacing:"-0.02em",
                        display:"flex", alignItems:"center", gap:6,
                      }}>
                        {showValueTooltip ? (
                          <InfoTooltip text={f.tooltip as string}>{f.vals[i] as string}</InfoTooltip>
                        ) : typeof f.vals[i] === "string" ? (
                          f.vals[i]
                        ) : (
                          <Check active={f.vals[i] as boolean} />
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )})}
        </div>

        {/* Note */}
        <p style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.graphite,
          letterSpacing:"0.06em",textTransform:"uppercase",textAlign:"center",marginTop:24 }}>
          {t.footerNote}
        </p>
      </div>
      <style>{`
        @media (min-width: 1024px) {
          .pricing-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 1023px) {
          .pricing-grid { grid-template-columns: 1fr; }
          .pricing-card { padding: 24px 20px !important; }
        }
      `}</style>
    </section>
  );
}
