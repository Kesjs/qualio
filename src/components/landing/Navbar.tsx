"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

const C = { canvas: "#000000", carbon: "#141414", ash: "#1a1a1a", granite: "#8a8380", stone: "#b8b3b0", bone: "#eeeeee", chalk: "#fafafa", orange: "#ee6018" };
type MenuKey = "product" | "resources";
type MenuItem = readonly [string, string, string];

const menus: Record<"en" | "fr", Record<MenuKey, readonly MenuItem[]>> = {
  en: {
    product: [["Overview", "See the complete QA flow", "/product"], ["Live browser scans", "Real clicks, forms, links, and journeys", "/product#scans"], ["Evidence & diagnosis", "Screenshots, network, console, and impact", "/product#evidence"], ["Scan history", "Verify fixes and catch regressions", "/product#history"]],
    resources: [["How Qualio works", "From a URL to a correction prompt", "/resources#how-it-works"], ["What Qualio detects", "The failures users actually feel", "/resources#detects"], ["Documentation", "The product details, in plain language", "/resources#docs"], ["System status", "See the current service status", "https://status.qualio.dev"]],
  },
  fr: {
    product: [["Vue d’ensemble", "Voir tout le parcours QA", "/product"], ["Scans navigateur", "Clics, formulaires, liens et parcours réels", "/product#scans"], ["Preuves & diagnostic", "Captures, réseau, console et impact", "/product#evidence"], ["Historique des scans", "Vérifier les correctifs et repérer les régressions", "/product#history"]],
    resources: [["Comment ça marche", "De l’URL au prompt de correction", "/resources#how-it-works"], ["Ce que Qualio détecte", "Les erreurs que vos utilisateurs ressentent", "/resources#detects"], ["Documentation", "Les détails du produit, en langage clair", "/resources#docs"], ["État du service", "Consulter l’état actuel du service", "https://status.qualio.dev"]],
  },
};

export function Navbar() {
  const { language } = useLanguage();
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const copy = menus[language];

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const syncUser = async () => {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      if (active) setUser(data.user ?? null);
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (active) setUser(session?.user ?? null);
      });
      unsubscribe = () => authListener.subscription.unsubscribe();
    };
    void syncUser();
    return () => { active = false; unsubscribe?.(); };
  }, []);

  const labels = language === "fr"
    ? { product: "Produit", resources: "Ressources", pricing: "Tarifs", solutions: "Solutions", login: "Se connecter", start: "Lancer un scan", dashboard: "Tableau de bord", menu: "Ouvrir le menu", close: "Fermer le menu" }
    : { product: "Product", resources: "Resources", pricing: "Pricing", solutions: "Solutions", login: "Log in", start: "Start a scan", dashboard: "Dashboard", menu: "Open menu", close: "Close menu" };

  const renderDropdown = (key: MenuKey) => (
    <AnimatePresence>
      {activeMenu === key && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onMouseLeave={() => setActiveMenu(null)}
          style={{
            position: "absolute", top: "calc(100% + 12px)",
            left: "50%", transform: "translateX(-50%)",
            width: "min(760px, calc(100vw - 32px))", padding: 12,
            border: `1px solid ${C.carbon}`, borderRadius: 14,
            background: "rgba(20,20,20,.98)", boxShadow: "0 20px 60px rgba(0,0,0,.48)",
            backdropFilter: "blur(22px)", zIndex: 20,
          }}
        >
          <MenuPanel keyName={key} items={copy[key]} language={language} />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return <>
    <style>{`
      .qualio-nav-shell { transition: max-width .35s cubic-bezier(.16,1,.3,1), height .35s cubic-bezier(.16,1,.3,1), margin-top .35s cubic-bezier(.16,1,.3,1), background .25s ease, border-color .25s ease; }
      .qualio-nav-item { color: ${C.granite}; transition: color .15s ease, background .18s ease, box-shadow .18s ease; }
      .qualio-nav-item:hover, .qualio-nav-item[data-open="true"] { color: ${C.bone}; background: rgba(255,255,255,.09); }
      .qualio-menu-link { display:flex; flex-direction:column; gap:7px; padding:12px 14px; border-radius:7px; text-decoration:none; transition:background .18s ease; }
      .qualio-menu-link:hover { background:rgba(255,255,255,.07); }
      .qualio-menu-link strong { color:${C.bone}; font-size:14px; font-weight:500; }
      .qualio-menu-link span { color:${C.granite}; font-size:12px; line-height:1.5; }
      .qualio-mobile-drawer { position:fixed; top:68px; left:0; right:0; z-index:99; padding:20px 18px 22px; border:1px solid ${C.carbon}; border-top:0; border-radius:0 0 14px 14px; background:${C.canvas}; box-shadow:0 24px 48px rgba(0,0,0,.55); }
      .qualio-mobile-links { display:flex; flex-direction:column; gap:2px; }
      .qualio-mobile-link { display:block; padding:13px 16px; color:${C.bone}; text-decoration:none; font-size:16px; line-height:1.35; border-radius:8px; }
      .qualio-mobile-link:hover { background:rgba(255,255,255,.06); }
      .qualio-mobile-footer { display:flex; align-items:stretch; gap:12px; margin-top:16px; padding-top:16px; border-top:1px solid ${C.carbon}; }
      .qualio-mobile-footer > a { flex:1; display:flex; align-items:center; justify-content:center; min-height:46px; padding:10px 14px; color:${C.canvas}; background:${C.chalk}; border-radius:8px; text-align:center; font-size:14px; font-weight:600; text-decoration:none; }
      .qualio-mobile-footer > :first-child { flex:0 0 auto; }
      @media(max-width:767px){ .qualio-nav-shell{max-width:1200px!important;height:68px!important;margin-top:0!important;border-radius:0!important;background:rgba(0,0,0,.88)!important;border-left-color:transparent!important;border-right-color:transparent!important;border-top-color:transparent!important}.qualio-nav-desktop{display:none!important}.qualio-nav-mobile{display:flex!important} }
    `}</style>
    <nav aria-label="Primary" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", justifyContent: "center", padding: "0 20px", pointerEvents: "none", fontFamily: "'Manrope', sans-serif" }}>
      <motion.div className="qualio-nav-shell" initial={false} animate={{ maxWidth: atTop ? 1200 : 1080, height: atTop ? 68 : 56, marginTop: atTop ? 0 : 16 }} style={{ pointerEvents: "auto", width: "100%", display: "flex", alignItems: "center", padding: "0 16px 0 24px", borderRadius: atTop ? 0 : 16, border: `1px solid ${atTop ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.08)"}`, background: atTop ? "transparent" : "rgba(0,0,0,.86)", backdropFilter: atTop ? "none" : "blur(24px) saturate(160%)", boxShadow: atTop ? "none" : "0 16px 40px -16px rgba(0,0,0,.95)" }}>
        <Link href="/" aria-label="Qualio home" style={{ display: "flex", alignItems: "center", flexShrink: 0, textDecoration: "none" }}><img src="/qualio-logo/export/lockup/lockup-brand-dark.svg" alt="Qualio" style={{ height: 32, width: "auto" }} /></Link>
        <div className="qualio-nav-desktop" style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 48 }}>
          {(["product", "resources"] as MenuKey[]).map(key => <div key={key} style={{ position: "relative" }}><button type="button" className="qualio-nav-item" data-open={activeMenu === key} onMouseEnter={() => setActiveMenu(key)} onFocus={() => setActiveMenu(key)} onClick={() => setActiveMenu(activeMenu === key ? null : key)} style={{ border: 0, borderRadius: 20, padding: "9px 13px", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>{labels[key]}</button>{renderDropdown(key)}</div>)}
          <a className="qualio-nav-item" href="/pricing" style={{ borderRadius: 20, padding: "9px 13px", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>{labels.pricing}</a>
          <a className="qualio-nav-item" href="/solutions" style={{ borderRadius: 20, padding: "9px 13px", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>{labels.solutions}</a>
        </div>
        <div className="qualio-nav-desktop" style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}><LanguageSwitcher />{!user && <a href="/login" style={{ color: C.stone, fontSize: 13, fontWeight: 500, textDecoration: "none" }}>{labels.login}</a>}<div style={{ width: 1, height: 14, background: "rgba(255,255,255,.1)" }} /><a href={user ? "/dashboard" : "/login?mode=register"} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.chalk, color: C.canvas, borderRadius: 8, padding: "10px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>{user ? labels.dashboard : labels.start}<span aria-hidden="true">→</span></a></div>
        <button type="button" className="qualio-nav-mobile" aria-label={mobileOpen ? labels.close : labels.menu} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)} style={{ display: "none", alignItems: "center", justifyContent: "center", width: 40, height: 40, marginLeft: "auto", color: C.bone, background: "transparent", border: `1px solid ${C.ash}`, borderRadius: 6, padding: 8 }}><svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">{mobileOpen ? <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /> : <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}</svg></button>
      </motion.div>
    </nav>
    <AnimatePresence>{mobileOpen && <motion.div className="qualio-mobile-drawer" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}><div className="qualio-mobile-links"><a className="qualio-mobile-link" href="/product" onClick={() => setMobileOpen(false)}>{labels.product}</a><a className="qualio-mobile-link" href="/resources" onClick={() => setMobileOpen(false)}>{labels.resources}</a><a className="qualio-mobile-link" href="/pricing" onClick={() => setMobileOpen(false)}>{labels.pricing}</a><a className="qualio-mobile-link" href="/solutions" onClick={() => setMobileOpen(false)}>{labels.solutions}</a></div><div className="qualio-mobile-footer"><LanguageSwitcher /><a href={user ? "/dashboard" : "/login?mode=register"}>{user ? labels.dashboard : labels.start}</a></div></motion.div>}</AnimatePresence>
  </>;
}

function MenuPanel({ keyName, items, language }: { keyName: MenuKey; items: readonly MenuItem[]; language: "en" | "fr" }) {
  const product = keyName === "product";
  const copy = product
    ? language === "fr"
      ? { kicker: "Le parcours Qualio", title: "De l’URL à la preuve exploitable.", body: "Un vrai navigateur, des preuves autour de chaque problème, puis un prompt de correction prêt à copier.", action: "Voir le produit", href: "/product" }
      : { kicker: "The Qualio workflow", title: "From URL to usable evidence.", body: "A real browser, evidence around every failure, and a correction prompt your team can copy.", action: "Explore the product", href: "/product" }
    : language === "fr"
      ? { kicker: "Le centre de ressources", title: "Comprendre avant de corriger.", body: "Les méthodes, les limites et les preuves qui expliquent ce que Qualio vérifie.", action: "Voir les ressources", href: "/resources" }
      : { kicker: "The resource center", title: "Understand before you fix.", body: "The workflow, boundaries, and evidence behind every Qualio check.", action: "Browse resources", href: "/resources" };

  return <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1.05fr .95fr", gap: 8, padding: 8, border: `1px solid ${C.ash}`, borderRadius: 9 }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{items.slice(0, 2).map(([title, desc, href]) => <a className="qualio-menu-link" key={href} href={href}><strong>{title}</strong><span>{desc}</span></a>)}</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 2, borderLeft: `1px solid ${C.ash}`, paddingLeft: 8 }}>{items.slice(2).map(([title, desc, href]) => <a className="qualio-menu-link" key={href} href={href}><strong>{title}</strong><span>{desc}</span></a>)}</div>
    <div style={{ borderLeft: `1px solid ${C.ash}`, paddingLeft: 16, paddingRight: 8, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 18 }}>
      <div><div style={{ color: C.orange, fontFamily: "var(--font-jetbrains-mono)", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>{copy.kicker}</div><div style={{ color: C.bone, fontSize: 16, lineHeight: 1.25, fontWeight: 500 }}>{copy.title}</div><p style={{ color: C.granite, fontSize: 12, lineHeight: 1.55, margin: "10px 0 0" }}>{copy.body}</p></div>
      <a href={copy.href} style={{ color: C.bone, fontSize: 12, textDecoration: "none" }}>{copy.action} <motion.span initial={{ x: 0 }} whileHover={{ x: 3 }} style={{ display: "inline-block" }}>→</motion.span></a>
    </div>
  </div>;
}
