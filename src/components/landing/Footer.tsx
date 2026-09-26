"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const C = { canvas:"#000000", carbon:"#141414", ash:"#1a1a1a", graphite:"#262626",
  granite:"#8a8380", stone:"#b8b3b0", bone:"#eeeeee", chalk:"#fafafa", orange:"#ee6018", green:"#a0ca92" };

const COLS = [
  {
    heading: "Product",
    links: [
      { label:"Features",   href:"#features" },
      { label:"How it works",href:"#how-it-works" },
      { label:"Pricing",    href:"#pricing" },
      { label:"Changelog",  href:"/changelog" },
      { label:"Status",     href:"https://status.qualio.dev" },
      { label:"Go to Dashboard", href:"/dashboard" },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label:"Docs",           href:"/docs" },
      { label:"API reference",  href:"/docs/api" },
      { label:"GitHub",         href:"https://github.com/qualio" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label:"Blog",    href:"/blog" },
      { label:"Twitter", href:"https://twitter.com/qualiodev" },
      { label:"Privacy", href:"/privacy" },
      { label:"Terms",   href:"/terms" },
    ],
  },
];

import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";

export function Footer() {
  const ref = useRef(null);
  const inView = useInView(ref, { once:true, margin:"-60px" });
  const { language } = useLanguage();

  return (
    <footer ref={ref} style={{
      background:C.canvas,
      borderTop:`1px solid ${C.carbon}`,
      padding:"64px 0 0",
      position:"relative", overflow:"hidden",
    }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px" }}>
        {/* Top row */}
        <div className="footer-top-grid" style={{ display:"grid", marginBottom:48, alignItems:"start" }}>

          {/* Brand */}
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20 }}>
              <img 
                src="/qualio-logo/export/lockup/lockup-brand-dark.svg" 
                alt="Qualio" 
                style={{ height: 32, width: "auto" }}
              />
            </div>
            <p style={{ fontFamily:"'Manrope',sans-serif",fontSize:14,fontWeight:400,
              lineHeight:1.65,color:C.granite,margin:"0 0 20px",maxWidth:280 }}>
              {translations[language].footerDesc}
            </p>
            <div style={{ display:"flex",alignItems:"center",gap:6 }}>
              <span style={{ width:6,height:6,borderRadius:"50%",background:C.green }}/>
              <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.green,
                letterSpacing:"0.06em",textTransform:"uppercase" }}>
                All systems operational
              </span>
            </div>
          </div>

          {/* Link columns */}
          {COLS.map((col, ci) => (
            <motion.div
              key={col.heading}
              initial={{ opacity:0, y:12 }}
              animate={inView?{opacity:1,y:0}:{}}
              transition={{ delay:ci*0.08, duration:0.4, ease:[0.4,0,0.2,1] }}
            >
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:400,
                letterSpacing:"0.1em",textTransform:"uppercase",color:C.orange,
                marginBottom:16 }}>
                {col.heading}
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {col.links.map(l => (
                  <a
                    key={l.label}
                    href={l.href}
                    style={{ fontFamily:"'Manrope',sans-serif",fontSize:14,fontWeight:400,
                      color:C.granite,lineHeight:1,
                      transition:"color 0.15s ease" }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.color=C.stone; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.color=C.granite; }}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom-row" style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"20px 0",borderTop:`1px solid ${C.carbon}` }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,
            color:C.graphite,letterSpacing:"-0.02em" }}>
            Â© 2026 Qualio. All rights reserved.
          </span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11,
            color:C.graphite,letterSpacing:"-0.02em" }}>
            Built with Playwright + AI
          </span>
        </div>
      </div>

      {/* Watermark â€” Factory signature large wordmark */}
      <motion.div
        initial={{ opacity:0 }}
        animate={inView?{opacity:1}:{}}
        transition={{ delay:0.3, duration:0.8, ease:[0.4,0,0.2,1] }}
        style={{
          textAlign:"center",
          fontFamily:"'Manrope',sans-serif",
          fontSize:"clamp(80px,14vw,200px)",
          fontWeight:400,
          letterSpacing:"-0.06em",
          lineHeight:0.85,
          color:"transparent",
          WebkitTextStroke:`1px ${C.carbon}`,
          userSelect:"none",
          pointerEvents:"none",
          overflow:"hidden",
          paddingTop:8,
        }}
      >
        Qualio
      </motion.div>
      <style>{`
        @media (min-width: 1024px) {
          .footer-top-grid { grid-template-columns: 1.5fr repeat(3, 1fr); gap: 64px; }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .footer-top-grid { grid-template-columns: 1fr 1fr; gap: 40px 32px; }
        }
        @media (max-width: 639px) {
          .footer-top-grid { grid-template-columns: 1fr; gap: 36px; }
          .footer-bottom-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
        }
      `}</style>
    </footer>
  );
}
