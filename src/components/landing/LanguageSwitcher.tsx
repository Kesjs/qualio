"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/i18n/translations";

// Brand tokens
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
  green: "#a0ca92"
};

const OPTIONS: { code: Language; label: string; title: string }[] = [
  { code: "en", label: "English", title: "English" },
  { code: "fr", label: "Français", title: "Français" },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const handleToggle = () => {
    const next: Language = language === "en" ? "fr" : "en";
    setLanguage(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  const currentOpt = OPTIONS.find(o => o.code === language) || OPTIONS[0];

  return (
    <motion.button
      layout
      type="button"
      aria-label={`Current language: ${currentOpt.title}. Click to switch.`}
      title={`Switch to ${language === "en" ? "Français" : "English"}`}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
      whileHover={{ filter: "brightness(1.1)" }} // Simple brightness bump on hover
      whileFocus={{ boxShadow: `0 0 0 2px rgba(255,255,255,0.6)` }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 32,
        padding: "0 12px",
        borderRadius: 8,
        backgroundColor: C.orange, // Solid orange background
        border: "none", // No border needed on solid button
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)", // Subtle inner highlight
        cursor: "pointer",
        outline: "none",
        color: C.chalk, // Pure white text for maximum readability on orange
        transition: "filter 0.2s ease",
      }}
    >
      <div style={{ position: "relative", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={currentOpt.code}
            initial={shouldReduceMotion ? { opacity: 0 } : { y: 15, opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: -15, opacity: 0 }}
            transition={{ type: "tween", duration: 0.15, ease: "easeOut" }}
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            {currentOpt.label}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
