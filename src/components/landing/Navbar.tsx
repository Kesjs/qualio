"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

const C = { canvas: "#000000", carbon: "#141414", ash: "#1a1a1a", granite: "#8a8380", stone: "#b8b3b0", bone: "#eeeeee", chalk: "#fafafa" };
type MenuKey = "product" | "resources";

const menus = {
  en: {
    product: [["Overview", "See the complete QA flow", "/product"], ["Live browser scans", "Real clicks, forms, links, and journeys", "/product#scans"], ["Evidence & diagnosis", "Screenshots, network, console, and impact", "/product#evidence"], ["Scan history", "Verify fixes and catch regressions", "/product#history"]],
    resources: [["How Qualio works", "From a URL to a correction prompt", "/resources#how-it-works"], ["What Qualio detects", "The failures users actually feel", "/resources#detects"], ["Documentation", "The product details, in plain language", "/resources#docs"], ["System status", "See the current service status", "https://status.qualio.dev"]],
  },
  fr: {
    product: [["Vue d’ensemble", "Voir tout le parcours QA", "/product"], ["Scans navigateur", "Clics, formulaires, liens et parcours réels", "/product#scans"], ["Preuves & diagnostic", "Captures, réseau, console et impact", "/product#evidence"], ["Historique des scans", "Vérifier les correctifs et repérer les régressions", "/product#history"]],
    resources: [["Comment ça marche", "De l’URL au prompt de correction", "/resources#how-it-works"], ["Ce que Qualio détecte", "Les erreurs que vos utilisateurs ressentent", "/resources#detects"], ["Documentation", "Les détails du produit, en langage clair", "/resources#docs"], ["État du service", "Consulter l’état actuel du service", "https://status.qualio.dev"]],
  },
} as const;

export function Navbar() {
  const { language } = useLanguage();
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const copy = menus[language];

  useEffect(() => { const onScroll = () => setAtTop(window.scrollY < 8); window.addEventListener("scroll", onScroll, { passive: true }); return () => window.removeEventListener("scroll", onScroll); }, []);
  useEffect(() => {
    let active = true; let unsubscribe: (() => void) | undefined;
    const syncUser = async () => { const { getSupabaseBrowserClient } = await import("@/lib/supabase/client"); const supabase = getSupabaseBrowserClient(); const { data } = await supabase.auth.getUser(); if (active) setUser(data.user ?? null); const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => { if (active) setUser(session?.user ?? null); }); unsubscribe = () => authListener.subscription.unsubscribe(); };
    void syncUser(); return () => { active = false; unsubscribe?.(); };
  }, []);

  const labels = language === "fr" ? { product: "Produit", resources: "Ressources", pricing: "Tarifs", contact: "Parler à l’équipe", login: "Se connecter", start: "Lancer un scan", dashboard: "Tableau de bord", menu: "Ouvrir le menu", close: "Fermer le menu" } : { product: "Product", resources: "Resources", pricing: "Pricing", contact: "Talk to the team", login: "Log in", start: "Start a scan", dashboard: "Dashboard", menu: "Open menu", close: "Close menu" };

  return <>
    <style>{`.qualio-nav-shell{transition:max-width .35s cubic-bezier(.16,1,.3,1),height .35s cubic-bezier(.16,1,.3,1),margin-top .35s cubic-bezier(.16,1,.3,1),background .25s ease,border-color .25s ease}.qualio-nav-item{color:${C.granite};transition:color .15s ease,background .2s ease}.qualio-nav-item:hover,.qualio-nav-item[data-open=true]{color:${C.bone};background:rgba(255,255,255,.07)}.qualio-menu-link{display:flex;flex-direction:column;gap:7px;padding:12px 14px;border-radius:7px;text-decoration:none;transition:background .18s ease}.qualio-menu-link:hover{background:rgba(255,255,255,.06)}.qualio-menu-link strong{color:${C.bone};font-size:14px;font-weight:500}.qualio-menu-link span{color:${C.granite};font-size:12px;line-height:1.5}@media(max-width:767px){.qualio-nav-shell{max-width:1200px!important;height:68px!important;margin-top:0!important;border-radius:0!important;background:rgba(0,0,0,.88)!important;border-left-color:transparent!important;border-right-color:transparent!important;border-top-color:transparent!important}.qualio-nav-desktop{display:none!important}.qualio-nav-mobile{display:block!important}}`}</style>
    <nav aria-label="Primary" style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, display:"flex", justifyContent:"center", padding:"0 20px", pointerEvents:"none", fontFamily:"'Manrope',sans-serif" }}>
      <motion.div className="qualio-nav-shell" initial={false} animate={{ maxWidth:atTop?1200:1080, height:atTop?68:56, marginTop:atTop?0:16 }} style={{ pointerEvents:"auto", width:"100%", display:"flex", alignItems:"center", padding:"0 16px 0 24px", borderRadius:atTop?0:16, border:`1px solid ${atTop?"rgba(255,255,255,.04)":"rgba(255,255,255,.08)"}`, background:atTop?"transparent":"rgba(0,0,0,.86)", backdropFilter:atTop?"none":"blur(24px) saturate(160%)", boxShadow:atTop?"none":"0 16px 40px -16px rgba(0,0,0,.95)" }}>
        <a href="/" aria-label="Qualio home" style={{ display:"flex", alignItems:"center", flexShrink:0, textDecoration:"none" }}><img src="/qualio-logo/export/lockup/lockup-brand-dark.svg" alt="Qualio" style={{ height:32, width:"auto" }} /></a>
        <div className="qualio-nav-desktop" style={{ display:"flex", alignItems:"center", gap:4, marginLeft:48 }}>
          {(["product", "resources"] as MenuKey[]).map(key => <button key={key} type="button" className="qualio-nav-item" data-open={activeMenu===key} onMouseEnter={() => setActiveMenu(key)} onClick={() => setActiveMenu(activeMenu===key?null:key)} style={{ border:0, borderRadius:20, padding:"9px 13px", background:"transparent", cursor:"pointer", fontSize:13, fontWeight:500 }}>{labels[key]}</button>)}
          <a className="qualio-nav-item" href="/pricing" style={{ borderRadius:20, padding:"9px 13px", textDecoration:"none", fontSize:13, fontWeight:500 }}>{labels.pricing}</a>
          <a className="qualio-nav-item" href="/contact" style={{ borderRadius:20, padding:"9px 13px", textDecoration:"none", fontSize:13, fontWeight:500 }}>{labels.contact}</a>
        </div>
        <div className="qualio-nav-desktop" style={{ display:"flex", alignItems:"center", gap:16, marginLeft:"auto" }}><LanguageSwitcher />{!user&&<a href="/login" style={{ color:C.stone, fontSize:13, fontWeight:500, textDecoration:"none" }}>{labels.login}</a>}<div style={{ width:1, height:14, background:"rgba(255,255,255,.1)" }} /><a href={user?"/dashboard":"/login?mode=register"} style={{ display:"inline-flex", alignItems:"center", gap:8, background:C.chalk, color:C.canvas, borderRadius:8, padding:"10px 16px", fontSize:13, fontWeight:600, textDecoration:"none", whiteSpace:"nowrap" }}>{user?labels.dashboard:labels.start}<span aria-hidden="true">→</span></a></div>
        <button type="button" className="qualio-nav-mobile" aria-label={mobileOpen?labels.close:labels.menu} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)} style={{ display:"none", marginLeft:"auto", color:C.bone, background:"transparent", border:`1px solid ${C.ash}`, borderRadius:4, padding:8 }}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">{mobileOpen ? <><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></> : <><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>}</svg></button>
      </motion.div>
      <AnimatePresence>{activeMenu&&<motion.div initial={{ opacity:0, y:-8, scale:.98 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-8, scale:.98 }} transition={{ duration:.22, ease:[.16,1,.3,1] }} style={{ position:"absolute", top:atTop?78:66, left:"50%", transform:"translateX(-50%)", width:"min(860px,calc(100vw - 32px))", padding:12, border:`1px solid ${C.carbon}`, borderRadius:14, background:"rgba(20,20,20,.97)", boxShadow:"0 20px 60px rgba(0,0,0,.45)", backdropFilter:"blur(22px)" }} onMouseLeave={() => setActiveMenu(null)}><div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, padding:8, border:`1px solid ${C.ash}`, borderRadius:9 }}><div style={{ display:"flex", flexDirection:"column", gap:2 }}>{copy[activeMenu].slice(0,2).map(([title,desc,href])=><a className="qualio-menu-link" key={href} href={href}><strong>{title}</strong><span>{desc}</span></a>)}</div><div style={{ display:"flex", flexDirection:"column", gap:2, borderLeft:`1px solid ${C.ash}`, paddingLeft:8 }}>{copy[activeMenu].slice(2,3).map(([title,desc,href])=><a className="qualio-menu-link" key={href} href={href}><strong>{title}</strong><span>{desc}</span></a>)}</div><div style={{ display:"flex", flexDirection:"column", gap:2, borderLeft:`1px solid ${C.ash}`, paddingLeft:8 }}>{copy[activeMenu].slice(3).map(([title,desc,href])=><a className="qualio-menu-link" key={href} href={href}><strong>{title}</strong><span>{desc}</span></a>)}</div></div></motion.div>}</AnimatePresence>
    </nav>
    <AnimatePresence>{mobileOpen&&<motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} style={{ position:"fixed", top:72, left:12, right:12, zIndex:99, padding:12, border:`1px solid ${C.carbon}`, borderRadius:10, background:"rgba(16,16,16,.98)", backdropFilter:"blur(20px)" }}><a href="/product" onClick={()=>setMobileOpen(false)} style={{ display:"block", padding:12, color:C.bone, textDecoration:"none" }}>{labels.product}</a><a href="/resources" onClick={()=>setMobileOpen(false)} style={{ display:"block", padding:12, color:C.bone, textDecoration:"none" }}>{labels.resources}</a><a href="/pricing" onClick={()=>setMobileOpen(false)} style={{ display:"block", padding:12, color:C.bone, textDecoration:"none" }}>{labels.pricing}</a><a href="/contact" onClick={()=>setMobileOpen(false)} style={{ display:"block", padding:12, color:C.bone, textDecoration:"none" }}>{labels.contact}</a><div style={{ borderTop:`1px solid ${C.carbon}`, marginTop:4, paddingTop:10, display:"flex", gap:8 }}><LanguageSwitcher /><a href={user?"/dashboard":"/login?mode=register"} style={{ flex:1, textAlign:"center", padding:10, color:C.canvas, background:C.chalk, borderRadius:4, textDecoration:"none", fontSize:13 }}>{user?labels.dashboard:labels.start}</a></div></motion.div>}</AnimatePresence>
  </>;
}
