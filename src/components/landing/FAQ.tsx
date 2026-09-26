"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";

const C = { canvas:"#000000", carbon:"#141414", ash:"#1a1a1a", graphite:"#262626",
  granite:"#8a8380", stone:"#b8b3b0", bone:"#eeeeee", chalk:"#fafafa", orange:"#ee6018", green:"#a0ca92" };

function FAQItem({ item, index }: { item: { q: string, a: string }; index: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once:true, margin:"-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity:0, y:12 }}
      animate={inView?{opacity:1,y:0}:{}}
      transition={{ delay:index*0.07, duration:0.4, ease:[0.4,0,0.2,1] }}
      style={{
        borderBottom: `1px solid ${C.carbon}`,
        borderLeft: open ? `2px solid ${C.orange}` : "2px solid transparent",
        transition:"border-color 0.15s ease, background 0.15s ease",
        background: open ? "rgba(238,96,24,0.025)" : "transparent",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="faq-btn"
        style={{
          width:"100%", textAlign:"left", background:"transparent", border:"none",
          padding:"22px 32px", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:24,
        }}
      >
        <span style={{
          fontFamily:"'Manrope',sans-serif",fontSize:16,fontWeight:400,
          lineHeight:1.4,letterSpacing:"-0.015em",
          color: open ? C.bone : C.stone,
          transition:"color 0.15s ease",
        }}>
          {item.q}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration:0.2, ease:[0.4,0,0.2,1] }}
          style={{
            width:24, height:24, borderRadius:"50%",
            border:`1px solid ${open ? C.orange : C.ash}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            flexShrink:0, color: open ? C.orange : C.granite,
            fontSize:16, lineHeight:1, transition:"border-color 0.15s ease, color 0.15s ease",
          }}
        >
          +
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }}
            transition={{ duration:0.3, ease:[0.4,0,0.2,1] }}
            style={{ overflow:"hidden" }}
          >
            <p className="faq-body" style={{
              fontFamily:"'Manrope',sans-serif",fontSize:14,fontWeight:400,
              lineHeight:1.65,color:C.granite,
              margin:0, padding:"0 32px 22px",
              maxWidth:640,
            }}>
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ() {
  const ref = useRef(null);
  const inView = useInView(ref, { once:true, margin:"-80px" });
  
  const { language } = useLanguage();
  const t = translations[language].faq;

  return (
    <section id="faq" style={{ background:C.canvas, padding:"96px 0" }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px" }}>
        <div className="faq-grid" style={{ display:"grid", alignItems:"start" }}>

          {/* Left — header */}
          <motion.div
            ref={ref}
            initial={{ opacity:0, y:16 }}
            animate={inView?{opacity:1,y:0}:{}}
            transition={{ duration:0.5, ease:[0.4,0,0.2,1] }}
            className="faq-header"
          >
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:16 }}>
              <span style={{ width:6,height:6,borderRadius:"50%",background:C.orange }}/>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:12,
                letterSpacing:"0.08em",textTransform:"uppercase",color:C.orange }}>{t.badge}</span>
            </div>
            <h2 style={{ fontFamily:"'Manrope',sans-serif",
              fontSize:"clamp(28px,3.5vw,36px)",fontWeight:400,
              lineHeight:1.1,letterSpacing:"-0.031em",color:C.bone,margin:"0 0 16px" }}>
              {t.titleStart}<br/>
              <span style={{ color:C.granite }}>{t.titleHighlight}</span>
            </h2>
            <p style={{ fontFamily:"'Manrope',sans-serif",fontSize:14,color:C.granite,lineHeight:1.6,margin:0 }}>
              {t.subtitle}
            </p>
            <a href="mailto:hello@qualio.dev" style={{
              display:"inline-flex",alignItems:"center",gap:6,
              fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.orange,
              letterSpacing:"0.06em",textTransform:"uppercase",marginTop:8,
              borderBottom:`1px solid rgba(238,96,24,0.3)`,paddingBottom:2,
            }}>
              hello@qualio.dev
            </a>
          </motion.div>

          {/* Right — accordion */}
          <div style={{ border:`1px solid ${C.carbon}`, borderRadius:10, overflow:"hidden" }}>
            {t.items.map((item, i) => (
              <FAQItem key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (min-width: 1024px) {
          .faq-grid { grid-template-columns: 1fr 2fr; gap: 80px; }
          .faq-header { position: sticky; top: 100px; }
        }
        @media (max-width: 1023px) {
          .faq-grid { grid-template-columns: 1fr; gap: 40px; }
          .faq-header { position: static; }
        }
        @media (max-width: 640px) {
          .faq-btn { padding: 18px 16px !important; }
          .faq-body { padding: 0 16px 18px !important; }
        }
      `}</style>
    </section>
  );
}
