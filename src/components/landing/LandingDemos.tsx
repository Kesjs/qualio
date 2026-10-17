'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, MessageSquare, RotateCcw, X } from 'lucide-react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { Select } from '@/components/dashboard/Select'
import styles from './landing-refresh.module.css'

const topics = [
  { label: 'Facturation', title: 'Rendre les factures plus faciles à retrouver.', summary: 'Ces trois avis décrivent le même obstacle : retrouver une facture depuis le compte.', quotes: ['Je cherche ma facture à chaque fin de mois.', 'Où peut-on télécharger les factures ?', 'Le paiement fonctionne, mais retrouver le reçu est compliqué.'], sources: ['Widget', 'Import CSV', 'Ajout manuel'] },
  { label: 'Prise en main', title: 'Clarifier la première étape après inscription.', summary: 'Ces trois avis suggèrent de mieux guider les premiers pas dans le produit.', quotes: ['Une fois inscrit, je ne sais pas par où commencer.', 'Un exemple au premier lancement serait utile.', 'J’ai compris le fonctionnement après quelques essais.'], sources: ['Widget', 'Widget', 'Import CSV'] },
  { label: 'Livraison', title: 'Mieux indiquer où suivre une commande.', summary: 'Ces trois avis évoquent un manque de visibilité sur le suivi de livraison.', quotes: ['Je ne trouve pas le lien pour suivre ma commande.', 'Le suivi devrait être visible depuis mon compte.', 'J’aimerais savoir où en est mon colis sans contacter le support.'], sources: ['Import CSV', 'Widget', 'Import CSV'] },
] as const

export function SignalDemo() {
  const [stage, setStage] = useState(0)
  const [playing, setPlaying] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { amount: 0.3 })
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!visible || !playing || reduce || stage >= 2) return
    const timer = window.setTimeout(() => setStage((value) => value + 1), 1800)
    return () => window.clearTimeout(timer)
  }, [visible, playing, reduce, stage])
  const selectStage = (value: number) => { setPlaying(false); setStage(value) }
  return (
    <div ref={ref} className={styles.signal}>
      <div className={styles.demoToolbar}><span>Qualio <span className={styles.toolbarDivider}>/</span> Vue d’ensemble</span><span className={styles.demoBadge}>Avis fictifs · démonstration</span></div>
      <div className={styles.signalBody}>
        <div className={styles.signalNavigation} role="group" aria-label="Étapes de la démonstration">
          {['Les avis', 'Le thème', 'La recommandation'].map((label, index) => <button key={label} type="button" aria-pressed={stage === index} onClick={() => selectStage(index)}><span className={styles.stepDot} />{label}{index < 2 && <ArrowRight size={14} aria-hidden="true" />}</button>)}
        </div>
        <div className={styles.signalContent}>
          <div className={styles.sourceStack}>{topics[0].quotes.map((quote, index) => <div key={quote} className={styles.sourceSlip} data-grouped={stage > 0}><span className={styles.mono}>{topics[0].sources[index]}</span><p>« {quote} »</p>{stage > 0 && <span className={styles.sourceTag}>Facturation</span>}</div>)}</div>
          <div className={styles.signalResult}><AnimatePresence mode="wait" initial={false}><motion.div key={stage} initial={{ opacity: 0.6, y: reduce ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0.4 }} transition={{ duration: 0.25 }}><h3>{stage === 0 ? 'Des retours qui se répondent.' : stage === 1 ? 'La facturation revient dans 3 avis.' : topics[0].title}</h3><p>{stage === 0 ? 'Des mots différents peuvent raconter la même difficulté.' : stage === 1 ? 'Les avis sont réunis autour du même thème pour faciliter la lecture.' : 'Ajoutez un accès visible aux factures depuis le compte client.'}</p><a href="#exemple" className={styles.evidenceLink}>Examiner les avis <ArrowRight size={16} aria-hidden="true" /></a></motion.div></AnimatePresence></div>
        </div>
      </div>
      <div className={styles.demoFooter}><span>De l’avis à la décision, avec les sources.</span><button type="button" onClick={() => { setStage(0); setPlaying(true) }} aria-label="Rejouer la démonstration"><RotateCcw size={14} aria-hidden="true" /> Rejouer</button></div>
    </div>
  )
}

export function EvidenceDemo() {
  const [topic, setTopic] = useState(0)
  const [decision, setDecision] = useState<string | null>(null)
  const [sourcesOpen, setSourcesOpen] = useState(true)
  const reduce = useReducedMotion()
  const current = topics[topic]
  return (
    <div className={styles.evidenceDemo}>
      <div className={styles.demoToolbar}><span>Cette semaine</span><span className={styles.demoBadge}>Démo interactive · avis fictifs</span></div>
      <div className={styles.evidenceGrid}>
        <div className={styles.topicList} role="group" aria-label="Choisir un thème d’exemple">{topics.map((item, index) => <button key={item.label} type="button" aria-pressed={index === topic} onClick={() => { setTopic(index); setDecision(null); setSourcesOpen(true) }}><span>{item.label}</span><span className={styles.mono}>3 avis</span><ArrowRight size={16} aria-hidden="true" /></button>)}</div>
        <div className={styles.recommendation}>
          <motion.div key={topic} initial={{ opacity: 0.7, x: reduce ? 0 : 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}><h3>{current.title}</h3><p>{current.summary}</p><button className={styles.sourcesToggle} type="button" aria-expanded={sourcesOpen} aria-controls="landing-evidence-sources" onClick={() => setSourcesOpen((value) => !value)}>{sourcesOpen ? 'Masquer les 3 avis sources' : 'Voir les 3 avis sources'}<ChevronDown size={16} aria-hidden="true" style={{ transform: sourcesOpen ? 'rotate(180deg)' : undefined }} /></button><div id="landing-evidence-sources" hidden={!sourcesOpen}><ul className={styles.quoteList}>{current.quotes.map((quote, index) => <li key={quote}><blockquote>« {quote} »</blockquote><span className={styles.mono}>{current.sources[index]}</span></li>)}</ul></div></motion.div>
          <div className={styles.decisionArea}><span>Quelle suite donner à cette piste ?</span><div className={styles.decisionButtons}>{['Accepter', 'Plus tard', 'Écarter'].map((label) => <button type="button" key={label} aria-pressed={decision === label} onClick={() => setDecision(label)}>{decision === label && <Check size={14} aria-hidden="true" />}{label}</button>)}</div><p role="status">{decision ? `Choix « ${decision} » simulé. Aucune donnée enregistrée.` : 'Essayez une décision : cette démonstration ne modifie aucun projet.'}</p></div>
        </div>
      </div>
    </div>
  )
}

export function WidgetDemo() {
  const [open, setOpen] = useState(true)
  const [sent, setSent] = useState(false)
  const [content, setContent] = useState('')
  const [rating, setRating] = useState('')
  return (
    <div className={styles.widgetCanvas}>
      <div className={styles.browserBar}><span className={styles.browserDots} aria-hidden="true"><i /><i /><i /></span><span>votre-site.fr</span><span>Démo</span></div>
      <div className={styles.sitePlaceholder} aria-hidden="true"><div /><div /><div /></div>
      {open && <div className={styles.widgetForm}><div className={styles.widgetFormHeading}><h3>{sent ? 'Merci pour votre avis' : 'Votre avis compte'}</h3><button type="button" aria-label="Fermer le widget de démonstration" onClick={() => setOpen(false)}><X size={18} aria-hidden="true" /></button></div>{sent ? <div className={styles.widgetSuccess} role="status"><Check size={28} aria-hidden="true" /><p>Votre avis rejoindrait votre espace Qualio.</p><small>Simulation : aucun avis envoyé.</small><button type="button" onClick={() => { setSent(false); setContent(''); setRating('') }}>Recommencer</button></div> : <form onSubmit={(event) => { event.preventDefault(); setSent(true) }}><p>Que pourrions-nous améliorer ?</p><label htmlFor="demo-widget-content">Votre avis<textarea id="demo-widget-content" rows={2} maxLength={500} required value={content} onChange={(event) => setContent(event.target.value)} placeholder="J’aimerais retrouver mes factures plus facilement…" /></label><div style={{ marginTop: '10px' }}><label id="demo-rating-label" style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '5px' }}>Note (facultative)</label><Select value={rating} onChange={setRating} placeholder="Choisir une note…" compact options={[{ value: '', label: '— Sans note' }, { value: '5', label: '5 / 5' }, { value: '4', label: '4 / 5' }, { value: '3', label: '3 / 5' }, { value: '2', label: '2 / 5' }, { value: '1', label: '1 / 5' }]} buttonClassName="!min-h-9 !py-1 !text-xs !rounded-[6px] !border-gray-300" /></div><button className={styles.widgetSubmit} type="submit">Simuler l’envoi <ArrowRight size={15} aria-hidden="true" /></button><small>Aucune donnée envoyée ou enregistrée.</small></form>}</div>}
      <button className={styles.widgetLauncher} type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}><MessageSquare size={17} aria-hidden="true" /> Laisser un avis</button>
    </div>
  )
}
