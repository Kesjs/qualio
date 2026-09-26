"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";

const C = { canvas:"#000000", carbon:"#141414", ash:"#1a1a1a", graphite:"#262626",
  granite:"#8a8380", stone:"#b8b3b0", bone:"#eeeeee", chalk:"#fafafa", orange:"#ee6018", green:"#a0ca92" };

/* ─── FEATURE BENTO — animated with useInView ─── */
const FEATURES_STATIC = [
  { id: "playwright", size: "wide", visual: <ScanVisual />, metricValue: "42+" },
  { id: "ai",         size: "normal", visual: <AiVisual />, metricValue: "5×" },
  { id: "evidence",   size: "normal", visual: null,         metricValue: "3" },
  { id: "history",    size: "normal", visual: <HistoryVisual />, metricValue: null },
  { id: "nosdk",      size: "normal", visual: null,         metricValue: "0" },
];

function ScanVisual() {
  const rows = [
    { icon:"✓", path:"/",         time:"280ms", c:C.green },
    { icon:"✓", path:"/pricing",  time:"312ms", c:C.green },
    { icon:"●", path:"/contact",  time:"—",     c:C.orange },
    { icon:"○", path:"/login",    time:"—",     c:C.graphite },
  ];
  return (
    <div style={{ background:"#0d0d0d",border:`1px solid ${C.carbon}`,borderRadius:3,padding:"12px 14px",marginTop:16 }}>
      {rows.map((r,i) => (
        <motion.div key={r.path}
          initial={{ opacity:0, x:-8 }} whileInView={{ opacity:1, x:0 }}
          transition={{ delay:i*0.1, duration:0.35 }}
          style={{ display:"flex",gap:10,padding:"4px 0",
            fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:r.c,letterSpacing:"-0.02em",
            borderBottom: i<rows.length-1?`1px solid ${C.carbon}`:"none" }}>
          <span style={{ width:12, flexShrink:0 }}>{r.icon}</span>
          <span style={{ flex:1 }}>{r.path}</span>
          <span style={{ color:C.stone }}>{r.time}</span>
        </motion.div>
      ))}
    </div>
  );
}

function AiVisual() {
  return (
    <div style={{ background:"#0d0d0d",border:`1px solid ${C.carbon}`,borderRadius:3,padding:"12px 14px",marginTop:16 }}>
      {[
        ["Impact",      "Users cannot initiate signup",  C.orange],
        ["Cause",       "Missing click handler (likely)", C.stone],
        ["Fix",         "Check listener on .cta-button",  C.green],
        ["Confidence",  "Medium",                         C.graphite],
      ].map(([k,v,col]) => (
        <div key={k as string} style={{ display:"flex",gap:12,padding:"4px 0",
          fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:"-0.02em",
          borderBottom:`1px solid ${C.carbon}` }}>
          <span style={{ color:C.graphite,width:64,flexShrink:0,textTransform:"uppercase",fontSize:9,letterSpacing:"0.08em",display:"flex",alignItems:"center" }}>{k as string}</span>
          <span style={{ color: col as string }}>{v as string}</span>
        </div>
      ))}
    </div>
  );
}

function HistoryVisual() {
  const data = [
    { date:"Sep 20", issues:8,  c:C.orange },
    { date:"Sep 22", issues:4,  c:C.stone },
    { date:"Sep 24", issues:2,  c:C.green },
  ];
  const max = 8;
  return (
    <div style={{ display:"flex",gap:6,alignItems:"flex-end",marginTop:16,height:60 }}>
      {data.map((d,i) => (
        <div key={d.date} style={{ flex:1,display:"flex",flexDirection:"column",gap:4,alignItems:"center" }}>
          <motion.div
            initial={{ height:0 }} whileInView={{ height:`${(d.issues/max)*52}px` }}
            transition={{ delay:i*0.15, duration:0.5, ease:[0.4,0,0.2,1] }}
            style={{ width:"100%",background:d.c,borderRadius:"2px 2px 0 0",minHeight:4 }}
          />
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.graphite,letterSpacing:"0.04em" }}>{d.date.slice(-2)}</span>
        </div>
      ))}
    </div>
  );
}

function BentoCell({ feat, index }: { feat: typeof FEATURES_STATIC[0] & any; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin:"-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity:0, y:20 }}
      animate={inView ? { opacity:1, y:0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.5, ease:[0.4,0,0.2,1] }}
      className={feat.size === "wide" ? "bento-cell-wide" : "bento-cell-normal"}
      style={{
        background: C.canvas,
        padding: 32,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        minHeight: feat.size === "wide" ? "auto" : 240,
      }}
    >
      <div>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:16,justifyContent:"space-between" }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.orange,
            letterSpacing:"0.08em",textTransform:"uppercase" }}>{feat.label}</span>
          {feat.metricLabel && (
            <div style={{ textAlign:"right" }}>
              <span style={{ fontFamily:"'Manrope',sans-serif",fontSize:24,fontWeight:400,
                color:C.bone,letterSpacing:"-0.04em" }}>{feat.metricValue}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:C.graphite,
                letterSpacing:"0.06em",textTransform:"uppercase",marginLeft:6 }}>{feat.metricLabel}</span>
            </div>
          )}
        </div>
        <h3 style={{ fontFamily:"'Manrope',sans-serif",fontSize:feat.size==="wide"?22:18,fontWeight:400,
          lineHeight:1.2,letterSpacing:"-0.025em",color:C.bone,margin:"0 0 10px",whiteSpace:"pre-line" }}>
          {feat.title}
        </h3>
        <p style={{ fontFamily:"'Manrope',sans-serif",fontSize:13,fontWeight:400,
          lineHeight:1.55,color:C.granite,margin:0,maxWidth:feat.size==="wide"?360:"none" }}>
          {feat.body}
        </p>
      </div>
      {feat.visual}
    </motion.div>
  );
}

export function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin:"-80px" });
  
  const { language } = useLanguage();
  const t = translations[language].features;

  return (
    <section id="features" style={{ background: C.canvas, padding:"96px 0" }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px" }}>
        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity:0, y:16 }}
          animate={inView ? { opacity:1, y:0 } : {}}
          transition={{ duration:0.5, ease:[0.4,0,0.2,1] }}
          style={{ marginBottom:48 }}
        >
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
        </motion.div>

        {/* Bento grid */}
        <div className="features-bento-grid" style={{
          display:"grid",
          gap:1,
          background:C.carbon,
          border:`1px solid ${C.carbon}`,
          borderRadius:10,
          overflow:"hidden",
        }}>
          {t.items.map((featText, i) => {
            const featData = { ...FEATURES_STATIC[i], ...featText };
            return <BentoCell key={featData.id} feat={featData} index={i} />;
          })}
        </div>
      </div>
      <style>{`
        @media (min-width: 1024px) {
          .features-bento-grid { grid-template-columns: repeat(3, 1fr); }
          .bento-cell-wide { grid-column: span 2; }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .features-bento-grid { grid-template-columns: repeat(2, 1fr); }
          .bento-cell-wide { grid-column: span 2; }
        }
        @media (max-width: 639px) {
          .features-bento-grid { grid-template-columns: 1fr; }
          .bento-cell-wide { grid-column: span 1; }
          .bento-cell-normal, .bento-cell-wide { padding: 22px 18px !important; }
        }
      `}</style>
    </section>
  );
}
