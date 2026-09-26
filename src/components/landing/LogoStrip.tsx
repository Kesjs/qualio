"use client";
import { memo, useState, useEffect, useRef } from "react";
import { motion, useMotionValue, animate, useReducedMotion } from "framer-motion";
import useMeasure from "react-use-measure";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";

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

const ITEMS_TYPES = [
  "check", "critical", "check", "critical", "check", "check", 
  "engine", "ai", "diff", "stack", "stack", "zero"
] as const;

const InfiniteSlider = memo(function InfiniteSlider({
  children, gap = 40, duration = 45,
}: { children: React.ReactNode; gap?: number; duration?: number }) {
  const [ref, { width }] = useMeasure();
  const x = useMotionValue(0);
  const [hovering, setHovering] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const ctrlRef = useRef<any>(null);

  useEffect(() => {
    if (!width || prefersReducedMotion) return;
    
    const contentW = width + gap;
    ctrlRef.current = animate(x, [0, -contentW / 2], {
      ease: "linear",
      duration: duration,
      repeat: Infinity,
      repeatType: "loop",
      onRepeat: () => x.set(0),
    });
    
    return () => {
      if (ctrlRef.current) ctrlRef.current.stop();
    };
  }, [width, gap, duration, x, prefersReducedMotion]);

  useEffect(() => {
    if (ctrlRef.current) {
      // Smoothly slow down on hover instead of restarting
      ctrlRef.current.speed = hovering ? 0.25 : 1;
    }
  }, [hovering]);

  if (prefersReducedMotion) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: `${gap}px`, justifyContent: "center", padding: "0 24px" }}>
        {children}
      </div>
    );
  }

  return (
    <div
      style={{ overflow: "hidden", padding: "4px 0" }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
    >
      <motion.div
        ref={ref}
        style={{ display: "flex", width: "max-content", gap: `${gap}px`, x }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
});

export function LogoStrip() {
  const { language } = useLanguage();
  const t = translations[language].logoStrip;

  return (
    <section style={{
      borderTop: `1px solid ${C.carbon}`,
      borderBottom: `1px solid ${C.carbon}`,
      padding: "48px 0 40px",
      background: `linear-gradient(to bottom, ${C.canvas}, rgba(29, 26, 24, 0.3))`,
      position: "relative",
      zIndex: 2,
    }}>
      <div style={{
        maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
      }}>
        <InfiniteSlider gap={24} duration={55}>
          {t.items.map((itemText, idx) => {
            const type = ITEMS_TYPES[idx];
            const isOrange = type === "critical" || type === "ai";
            const isGreen = type === "check" || type === "zero";
            const isStack = type === "stack" || type === "engine";

            return (
              <motion.div 
                key={idx} 
                whileHover={{ 
                  backgroundColor: "rgba(255, 255, 255, 0.05)", 
                  borderColor: C.ash,
                  y: -2
                }}
                transition={{ duration: 0.2 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexShrink: 0,
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.015)",
                  border: `1px solid ${C.carbon}`,
                  borderRadius: 8,
                  cursor: "default",
                }}
              >
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 11,
                  color: isOrange ? C.orange : isGreen ? C.green : C.granite,
                  lineHeight: 1,
                }}>
                  {isOrange ? (
                    <div style={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: "50%", 
                      background: C.orange, 
                      boxShadow: `0 0 8px ${C.orange}90` 
                    }} />
                  ) : isGreen ? "âœ“" : "â—†"}
                </span>
                <span style={{
                  fontFamily: "'Manrope',sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  color: isStack ? C.bone : C.stone,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                }}>
                  {itemText}
                </span>
              </motion.div>
            );
          })}
        </InfiniteSlider>
      </div>

      <div className="logo-strip-stats" style={{
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 11,
        color: C.granite,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        textAlign: "center",
        marginTop: 32,
        marginBottom: 0,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "12px",
        alignItems: "center"
      }}>
        <span>{t.stats[0]}</span>
        <span className="sep" style={{ color: C.carbon }}>/</span>
        <span>{t.stats[1]}</span>
        <span className="sep" style={{ color: C.carbon }}>/</span>
        <span>{t.stats[2]}</span>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .sep { display: none; }
        }
      `}</style>
    </section>
  );
}
