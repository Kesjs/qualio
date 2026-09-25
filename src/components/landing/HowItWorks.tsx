"use client";
import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";

const C = { canvas:"#101010", carbon:"#1d1a18", ash:"#3d3a39", graphite:"#4d4947",
  granite:"#8a8380", stone:"#b8b3b0", bone:"#eeeeee", chalk:"#fafafa", orange:"#ee6018", green:"#a0ca92" };

// Terminal logs kept hardcoded as they represent technical output, but updated qualio to Qualio
const TERMINAL_LOGS = [
  [
    { c:C.stone,  t:"Qualio scan https://acme.com" },
    { c:C.graphite, t:"  â†³ Resolving routesâ€¦" },
    { c:C.green,  t:"  â†³ 6 pages found" },
    { c:C.stone,  t:"  â†³ Depth: Standard (recommended)" },
  ],
  [
    { c:C.green,  t:"âœ“  GET / â†’ 200 Â· 280ms" },
    { c:C.green,  t:"âœ“  GET /pricing â†’ 200 Â· 312ms" },
    { c:C.orange, t:"â—  POST /contact â†’ 500 Â· 1.2s" },
    { c:C.orange, t:"âœ—  /pricing CTA â†’ no response" },
  ],
  [
    { c:C.orange,   t:"[Critical]  Dead click on /pricing" },
    { c:C.stone,    t:"  Impact    Â· Users can't start trial" },
    { c:C.stone,    t:"  Cause     Â· Missing click handler" },
    { c:C.graphite, t:"  ConfidenceÂ· Medium" },
  ],
  [
    { c:C.green,  t:"âœ“  /pricing CTA â†’ working (resolved)" },
    { c:C.green,  t:"âœ“  /contact form â†’ working (resolved)" },
    { c:C.orange, t:"â†‘  /login redirect â†’ new issue" },
    { c:C.stone,  t:"âŠ–  0 critical issues remaining" },
  ],
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once:true, margin:"-80px" });
  
  const { language } = useLanguage();
  const t = translations[language].howItWorks;

  return (
    <section id="how-it-works" style={{ background:C.canvas, padding:"96px 0" }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px" }}>

        {/* Header */}
        <motion.div
          ref={ref}
          initial={{ opacity:0, y:16 }}
          animate={inView?{opacity:1,y:0}:{}}
          transition={{ duration:0.5, ease:[0.4,0,0.2,1] }}
          style={{ marginBottom:64 }}
        >
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:16 }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background:C.orange }}/>
            <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:12,
              letterSpacing:"0.08em",textTransform:"uppercase",color:C.orange }}>{t.badge}</span>
          </div>
          <h2 style={{ fontFamily:"'Manrope',sans-serif",
            fontSize:"clamp(32px,4vw,44px)",fontWeight:400,
            lineHeight:1.1,letterSpacing:"-0.025em",
            color:C.bone,margin:0,maxWidth:480 }}>
            {t.titleStart}<br/>
            <span style={{ color:C.granite }}>{t.titleHighlight}</span>
          </h2>
        </motion.div>

        {/* Layout: step rail + terminal panel */}
        <div className="hiw-grid" style={{ display:"grid", gap:1, background:C.carbon,
          border:`1px solid ${C.carbon}`, borderRadius:10, overflow:"hidden" }}>

          {/* Step list */}
          <div style={{ background:C.canvas }}>
            {t.steps.map((step, i) => (
              <motion.button
                key={i}
                initial={{ opacity:0, x:-16 }}
                animate={inView?{opacity:1,x:0}:{}}
                transition={{ delay:i*0.1, duration:0.45, ease:[0.4,0,0.2,1] }}
                onClick={() => setActive(i)}
                className="hiw-step-btn"
                style={{
                  width:"100%", textAlign:"left", background:"transparent",
                  border:"none", borderBottom:`1px solid ${C.carbon}`, cursor:"pointer",
                  padding:"28px 32px",
                  borderLeft: active===i ? `2px solid ${C.orange}` : "2px solid transparent",
                  transition:"border-color 0.15s ease, background 0.15s ease",
                }}
                onMouseEnter={e => { if(active!==i)(e.currentTarget as HTMLButtonElement).style.background=C.carbon; }}
                onMouseLeave={e => { if(active!==i)(e.currentTarget as HTMLButtonElement).style.background="transparent"; }}
              >
                <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,
                    color: active===i ? C.orange : C.graphite,
                    letterSpacing:"0.08em",flexShrink:0,transition:"color 0.15s ease" }}>
                    0{i + 1}
                  </span>
                  <div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,
                       color: active===i ? C.orange : C.graphite,
                      letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4,
                      transition:"color 0.15s ease" }}>
                      {step.label}
                    </div>
                    <div style={{ fontFamily:"'Manrope',sans-serif",fontSize:17,fontWeight:400,
                      lineHeight:1.3,letterSpacing:"-0.02em",
                      color: active===i ? C.bone : C.granite,
                      transition:"color 0.15s ease" }}>
                      {step.title}
                    </div>
                    {active===i && (
                      <motion.p
                        initial={{ opacity:0, height:0 }}
                        animate={{ opacity:1, height:"auto" }}
                        transition={{ duration:0.25, ease:[0.4,0,0.2,1] }}
                        style={{ fontFamily:"'Manrope',sans-serif",fontSize:13,color:C.granite,
                          lineHeight:1.55,margin:"8px 0 0",maxWidth:320 }}>
                        {step.body}
                      </motion.p>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Terminal output */}
          <div style={{ background:"#0a0a0a", display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex",alignItems:"center",gap:6,padding:"12px 16px",
              borderBottom:`1px solid ${C.carbon}` }}>
              <span style={{ width:10,height:10,borderRadius:"50%",background:"#ff5f57" }}/>
              <span style={{ width:10,height:10,borderRadius:"50%",background:"#febc2e" }}/>
              <span style={{ width:10,height:10,borderRadius:"50%",background:"#28c840" }}/>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.graphite,
                marginLeft:8,letterSpacing:"-0.02em" }}>
                Qualio Â· workspace
              </span>
            </div>
            <div style={{ flex:1, padding:24, display:"flex", flexDirection:"column", justifyContent:"center" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity:0, y:8 }}
                  animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-6 }}
                  transition={{ duration:0.28, ease:[0.4,0,0.2,1] }}
                >
                  {TERMINAL_LOGS[active].map((line,j) => (
                    <motion.div key={j}
                      initial={{ opacity:0, x:-6 }}
                      animate={{ opacity:1, x:0 }}
                      transition={{ delay:j*0.12, duration:0.3 }}
                      style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:13,
                        color:line.c, letterSpacing:"-0.02em",
                        padding:"6px 0",
                        borderBottom: j<TERMINAL_LOGS[active].length-1?`1px solid ${C.carbon}`:"none" }}>
                      {line.t}
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (min-width: 1024px) {
          .hiw-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 1023px) {
          .hiw-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .hiw-step-btn { padding: 18px 16px !important; }
        }
      `}</style>
    </section>
  );
}
