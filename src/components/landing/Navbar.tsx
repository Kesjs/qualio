"use client";
import { useEffect, useLayoutEffect, useState } from "react";
import { motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

const C = {
  canvas: "#000000", carbon: "#141414", ash: "#1a1a1a", graphite: "#262626",
  granite: "#8a8380", stone: "#b8b3b0", bone: "#eeeeee", chalk: "#fafafa", orange: "#ee6018", green: "#a0ca92"
};

// ← FIX : évalué une seule fois, en dehors du composant, pour ne jamais
// dépendre d'un état initial "false" qui se corrige après coup.
const getIsMobile = () => typeof window !== "undefined" && window.innerWidth < 768;

export function Navbar() {
  const { language } = useLanguage();
  const [atTop, setAtTop] = useState(true);
  const [dir, setDir] = useState<"up" | "down">("up");
  // ← FIX : lazy initializer, calculé dès le premier rendu client au lieu
  // de démarrer à `false` puis de basculer après montage (ce qui provoquait
  // un premier rendu "desktop" suivi d'un saut visuel vers l'état mobile).
  const [mobile, setMobile] = useState(getIsMobile);
  const [menuOpen, setMenuOpen] = useState(false);

  // ← FIX : useLayoutEffect (pas useEffect) pour resynchroniser `mobile`
  // avant la peinture du navigateur si jamais la valeur SSR différait.
  useLayoutEffect(() => {
    setMobile(getIsMobile());
    const onResize = () => setMobile(getIsMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    // ← FIX : sur mobile la navbar est figée (pas de floating/compact), donc
    // on ne branche même plus l'écouteur de scroll — ça évite tout recalcul
    // (et toute micro-animation) déclenché par le scroll ou par le
    // redimensionnement de la barre d'adresse de Safari iOS pendant le scroll.
    if (mobile) return;

    let lastY = window.scrollY, raf = 0;
    const update = () => {
      const y = window.scrollY;
      setAtTop(y < 8);
      if (y - lastY > 4) setDir("down");
      else if (lastY - y > 4) setDir("up");
      lastY = y; raf = 0;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mobile]);

  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const syncUser = async () => {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClient();

      const { data } = await supabase.auth.getUser();
      if (active) setUser(data.user ?? null);

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (active) setUser(session?.user ?? null);
      });
      unsubscribe = () => authListener.subscription.unsubscribe();
    };

    void syncUser();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  // ← sur mobile, on désactive complètement le mode "floating/compact" au scroll :
  // la navbar reste fixe, seule l'animation desktop reste active.
  const floating = !mobile && !atTop;
  const compact = !mobile && floating && dir === "down";
  const dashboardLabel = language === "fr" ? "Tableau de bord" : "Dashboard";
  const navLinks = language === "fr"
    ? [{ label: "Fonctionnalités", href: "#features" }, { label: "Tarifs", href: "#pricing" }]
    : [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }];
  const loginLabel = language === "fr" ? "Se connecter" : "Log in";
  const startLabel = language === "fr" ? "Lancer un scan" : "Start a scan";
  const startLabelMobile = language === "fr" ? "Commencer →" : "Get started →";

  // ← FIX : cible d'animation figée pour mobile, définie une seule fois,
  // pour garantir que framer-motion ne reçoit jamais un objet dont les
  // valeurs varient d'un rendu à l'autre sur mobile.
  const mobileAnimate = { maxWidth: 1200, height: 68, marginTop: 0 };
  const desktopAnimate = {
    maxWidth: floating ? 1080 : 1200,
    height: floating ? 56 : 68,
    marginTop: floating ? 16 : 0,
  };

  return (
    <>
      <nav
        aria-label="Primary"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          display: "flex", justifyContent: "center",
          padding: "0 20px", pointerEvents: "none",
          fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <motion.div
          initial={false}
          animate={mobile ? mobileAnimate : desktopAnimate}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            pointerEvents: "auto",
            display: "flex", alignItems: "center", justifyContent: "flex-start",
            gap: 0, width: "100%",
            maxWidth: 1200,
            height: 68,
            marginTop: 0,
            padding: "0 16px 0 24px",
            borderRadius: floating ? 16 : 0,
            borderBottom: floating ? `1px solid rgba(255,255,255,0.06)` : `1px solid rgba(255,255,255,0.04)`,
            borderTop: floating ? `1px solid rgba(255,255,255,0.08)` : "1px solid transparent",
            borderLeft: floating ? `1px solid rgba(255, 255, 255, 0.08)` : "1px solid transparent",
            borderRight: floating ? `1px solid rgba(255, 255, 255, 0.08)` : "1px solid transparent",
            background: floating ? "rgba(0, 0, 0, 0.85)" : (mobile ? "rgba(0,0,0,0.85)" : "transparent"),
            backdropFilter: floating || mobile ? "blur(24px) saturate(200%)" : "none",
            WebkitBackdropFilter: floating || mobile ? "blur(24px) saturate(200%)" : "none",
            boxShadow: floating ? "0 16px 40px -16px rgba(0,0,0,0.95)" : "none",
          }}
        >
          {/* Wordmark */}
          <a href="#top" aria-label="Qualio home"
            style={{ display: "flex", alignItems: "center", flexShrink: 0, textDecoration: "none" }}>
            <img 
              src="/qualio-logo/export/lockup/lockup-brand-dark.svg" 
              alt="Qualio" 
              style={{ height: 32, width: "auto" }}
            />
          </a>

          {/* Center links */}
          {!mobile && (
            <motion.div
              style={{
                display: "flex", gap: 32, overflow: "hidden",
                marginLeft: 48
              }}
            >
              {navLinks.map(l => (
                <a key={l.href} href={l.href}
                  style={{
                    color: C.granite, fontSize: 13, fontWeight: 500,
                    whiteSpace: "nowrap", letterSpacing: "0.01em",
                    textDecoration: "none",
                    transition: "color 0.15s ease"
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.color = C.bone; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.color = C.granite; }}
                >
                  {l.label}
                  {l.label === "Status" && (
                    <span style={{
                      display: "inline-block", width: 5, height: 5, borderRadius: "50%",
                      background: C.green, marginLeft: 6, verticalAlign: "middle"
                    }} />
                  )}
                </a>
              ))}
            </motion.div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: mobile ? 12 : 24, marginLeft: "auto", flexShrink: 0 }}>
            {!mobile && (
              <LanguageSwitcher />
            )}
            
            {!mobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {!user && (
                  <a href="/login"
                    style={{
                      color: C.stone, fontSize: 13, fontWeight: 500,
                      transition: "color 0.15s ease", textDecoration: "none"
                    }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.color = C.bone; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.color = C.stone; }}>
                    {loginLabel}
                  </a>
                )}
                <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", borderRadius: 1 }} />
              </div>
            )}
            <motion.a
              href={user ? "/dashboard" : "/login?mode=register"}
              whileHover="hover"
              initial="rest"
              style={{
                position: "relative",
                display: "inline-flex", alignItems: "center", gap: 8,
                background: C.bone, color: C.canvas, borderRadius: 8,
                padding: compact ? "8px 16px" : "10px 20px",
                fontSize: 13, fontWeight: 600, lineHeight: 1, whiteSpace: "nowrap",
                textDecoration: "none", cursor: "pointer", overflow: "hidden",
                boxShadow: `0 0 0 1px ${C.bone}, 0 4px 12px -2px rgba(255, 255, 255, 0.15)`
              }}
            >
              <motion.div
                variants={{
                  rest: { left: "-100%" },
                  hover: { left: "100%" }
                }}
                transition={{ duration: 0.55, ease: "easeInOut" }}
                style={{
                  position: "absolute", top: 0, bottom: 0, width: "30%",
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
                  transform: "skewX(-20deg)", zIndex: 0
                }}
              />
              <span style={{ position: "relative", zIndex: 1 }}>
                {user ? dashboardLabel : (mobile ? startLabelMobile : startLabel)}
              </span>
              {!mobile && !user && (
                <motion.span
                  variants={{
                    rest: { x: 0 },
                    hover: { x: 3 }
                  }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  style={{ display: "flex", alignItems: "center", position: "relative", zIndex: 1 }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6h7M6 2.5L9.5 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              )}
            </motion.a>

            {/* Mobile menu button */}
            {mobile && (
              <button
                type="button"
                aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  background: "transparent", border: `1px solid ${C.ash}`, borderRadius: 3,
                  padding: "8px", cursor: "pointer", display: "flex", alignItems: "center",
                  color: C.bone
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  {menuOpen
                    ? <><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>
                    : <><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>
                  }
                </svg>
              </button>
            )}
          </div>
        </motion.div>
      </nav>

      {/* Mobile dropdown */}
      {mobile && menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: "fixed", top: 72, left: 12, right: 12, zIndex: 99,
            background: "rgba(16,16,16,0.97)", border: `1px solid ${C.carbon}`,
            borderRadius: 10, padding: 16,
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {navLinks.map(l => (
            <a key={l.href} href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 8px", borderBottom: `1px solid ${C.carbon}`,
                fontFamily: "'Manrope',sans-serif", fontSize: 15, color: C.stone
              }}>
              {l.label}
              {l.label === "Status" && (
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />
              )}
            </a>
          ))}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 8px", borderBottom: `1px solid ${C.carbon}`
          }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: C.granite }}>
              Language
            </span>
            <LanguageSwitcher />
          </div>
          <div style={{ padding: "12px 8px 0", display: "flex", gap: 8 }}>
            {user ? (
              <a href="/dashboard" onClick={() => setMenuOpen(false)} style={{
                flex: 1, textAlign: "center", padding: "10px",
                background: C.chalk, color: C.canvas, borderRadius: 3,
                fontFamily: "'Manrope',sans-serif", fontSize: 14, fontWeight: 500,
                textDecoration: "none"
              }}>
                {dashboardLabel}
              </a>
            ) : (
              <>
                <a href="/login" onClick={() => setMenuOpen(false)} style={{
                  flex: 1, textAlign: "center", padding: "10px",
                  background: C.carbon, color: C.bone, borderRadius: 3,
                  fontFamily: "'Manrope',sans-serif", fontSize: 14,
                  textDecoration: "none"
                }}>
                  Log in
                </a>
                <a href="/login?mode=register" onClick={() => setMenuOpen(false)} style={{
                  flex: 1, textAlign: "center", padding: "10px",
                  background: C.chalk, color: C.canvas, borderRadius: 3,
                  fontFamily: "'Manrope',sans-serif", fontSize: 14, fontWeight: 500,
                  textDecoration: "none"
                }}>
                  Get started →
                </a>
              </>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}
