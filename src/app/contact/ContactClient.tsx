'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  ArrowRight, 
  Check, 
  Clock, 
  Copy, 
  HelpCircle, 
  Mail, 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react'
import { Select } from '@/components/dashboard/Select'
import { ACCENT, ACCENT_INK, INK, LINE, MUTED, R_BUTTON } from '@/components/landing/tokens'

const CONTACT_EMAIL = 'contact@tryqualio.pro'

const SUBJECT_OPTIONS = [
  { value: 'Demande générale', label: 'Question générale sur le produit' },
  { value: 'Offre Agence & Démo', label: 'Demande de démo / Offre Agence' },
  { value: 'Intégration widget', label: 'Aide à l’intégration du widget sur mon site' },
  { value: 'Facturation & Plans', label: 'Question sur les tarifs ou la facturation' },
  { value: 'Autre sujet', label: 'Autre demande' },
] as const

const FAQS = [
  {
    q: 'Comment fonctionne l’essai gratuit ?',
    a: 'Vous pouvez importer jusqu’à 50 avis ou installer le widget immédiatement, sans renseigner de carte bancaire.',
  },
  {
    q: 'Le widget fonctionne-t-il sur n’importe quel site ?',
    a: 'Oui. Une simple balise <script> suffit sur Webflow, WordPress, Shopify, Next.js ou du HTML statique.',
  },
  {
    q: 'Proposez-vous un accompagnement dédié aux agences ?',
    a: 'Oui, le forfait Agence permet de gérer jusqu’à 15 projets clients avec des rapports dédiés et un support prioritaire.',
  },
]

export function ContactClient() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState<string>(SUBJECT_OPTIONS[0].value)
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Fallback
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject,
          message: message.trim(),
          honeypot,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de l’envoi. Veuillez réessayer.')
      }

      setSuccess(true)
      setName('')
      setEmail('')
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de communication avec le serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pt-8 pb-24">
      {/* En-tête */}
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium" style={{ borderColor: LINE, color: MUTED }}>
          <Sparkles className="h-3.5 w-3.5" style={{ color: ACCENT }} />
          <span>Support & Équipe Qualio</span>
        </div>
        <h1 className="mt-4 text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.035em]" style={{ color: INK }}>
          Comment pouvons-nous vous aider ?
        </h1>
        <p className="mt-4 text-base leading-relaxed sm:text-lg" style={{ color: MUTED }}>
          Une question sur la collecte de vos avis, le widget, les plans Pro et Agence ou un besoin spécifique ? Écrivez-nous, nous répondons personnellement sous 24h ouvrées.
        </p>
      </div>

      {/* Grille 2 colonnes */}
      <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-14">
        {/* Colonne Gauche : Coordonnées directes, réassurance & FAQ */}
        <div className="space-y-8 lg:col-span-5">
          {/* Carte Email professionnel */}
          <div className="rounded-2xl border bg-[#fafafa] p-6" style={{ borderColor: LINE }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs border" style={{ borderColor: LINE, color: ACCENT }}>
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: MUTED }}>Notre email direct</span>
                <p className="text-base font-medium" style={{ color: INK }}>{CONTACT_EMAIL}</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed" style={{ color: MUTED }}>
              Vous préférez votre client de messagerie habituel ? Écrivez-nous directement ou copiez l’adresse en un clic.
            </p>

            <div className="mt-5 flex items-center gap-2.5">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-95"
                style={{ background: '#18181b' }}
              >
                <span>Ouvrir l’email</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-xs font-medium transition hover:bg-zinc-50"
                style={{ borderColor: LINE, color: INK }}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Adresse copiée !</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Copier l’adresse</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Carte Engagement Réponse & Widget */}
          <div className="space-y-4 rounded-2xl border p-6" style={{ borderColor: LINE }}>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <h3 className="text-sm font-semibold" style={{ color: INK }}>Réponse garantie sous 24h</h3>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: MUTED }}>
                  Du lundi au vendredi. Nos réponses sont rédigées par des humains qui conçoivent et développent le produit.
                </p>
              </div>
            </div>

            <div className="border-t pt-4" style={{ borderColor: LINE }}>
              <div className="flex items-start gap-3">
                <MessageSquare className="mt-0.5 h-5 w-5 shrink-0" style={{ color: ACCENT }} />
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: INK }}>Testez notre widget en bas à droite</h3>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: MUTED }}>
                    Le bouton orange flottant est le widget Qualio en condition réelle. Vous pouvez aussi nous y laisser un avis direct !
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mini FAQ */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: INK }}>
              Questions courantes
            </h3>
            <div className="space-y-3">
              {FAQS.map((item, idx) => (
                <div key={idx} className="rounded-xl border p-4 text-xs" style={{ borderColor: LINE }}>
                  <div className="flex items-center gap-2 font-medium" style={{ color: INK }}>
                    <HelpCircle className="h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} />
                    <span>{item.q}</span>
                  </div>
                  <p className="mt-2 pl-5.5 leading-relaxed" style={{ color: MUTED }}>
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne Droite : Formulaire interactif */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border bg-white p-7 shadow-xs sm:p-9" style={{ borderColor: LINE }}>
            {success ? (
              <div className="py-8 text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-xl font-semibold" style={{ color: INK }}>
                  Message envoyé avec succès !
                </h2>
                <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed" style={{ color: MUTED }}>
                  Merci pour votre message. Il a bien été transmis à l’équipe Qualio sur <strong>{CONTACT_EMAIL}</strong>. Nous vous répondrons très rapidement.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setSuccess(false)}
                    className={`rounded-lg border px-4 py-2.5 text-xs font-semibold transition hover:bg-zinc-50 ${R_BUTTON}`}
                    style={{ borderColor: LINE, color: INK }}
                  >
                    Envoyer un autre message
                  </button>
                  <Link
                    href="/"
                    className={`rounded-lg px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-95 ${R_BUTTON}`}
                    style={{ background: '#18181b' }}
                  >
                    Retour à l’accueil
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight" style={{ color: INK }}>
                    Envoyer un message
                  </h2>
                  <p className="mt-1 text-xs" style={{ color: MUTED }}>
                    Remplissez les détails ci-dessous. Tous les champs marqués d’un astérisque sont obligatoires.
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800">
                    {error}
                  </div>
                )}

                {/* Champ Honeypot caché anti-bot */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="company_website">Ne pas remplir si humain</label>
                  <input
                    id="company_website"
                    type="text"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* Nom & Email en ligne sur desktop */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-xs font-medium" style={{ color: INK }}>
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder="Alexandre Martin"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={120}
                      autoComplete="name"
                      className="mt-1.5 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm transition focus:border-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10"
                      style={{ borderColor: LINE }}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-medium" style={{ color: INK }}>
                      Adresse email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="alexandre@entreprise.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={254}
                      autoComplete="email"
                      className="mt-1.5 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm transition focus:border-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10"
                      style={{ borderColor: LINE }}
                    />
                  </div>
                </div>

                {/* Objet de la demande */}
                <div>
                  <label id="contact-subject-label" className="block text-xs font-medium mb-1.5" style={{ color: INK }}>
                    Objet de votre demande <span className="text-red-500">*</span>
                  </label>
                  <Select
                    label="Objet de votre demande"
                    value={subject}
                    onChange={(val) => setSubject(val)}
                    options={SUBJECT_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                    buttonClassName="bg-white border-zinc-200 focus-visible:border-zinc-900 focus-visible:ring-zinc-900/10 text-sm"
                  />
                </div>

                {/* Message */}
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="message" className="block text-xs font-medium" style={{ color: INK }}>
                      Votre message <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px]" style={{ color: MUTED }}>
                      {message.length} / 5000
                    </span>
                  </div>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    placeholder="Expliquez-nous votre besoin, votre projet ou la question que vous vous posez…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={5000}
                    className="mt-1.5 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm leading-relaxed transition focus:border-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-zinc-900/10"
                    style={{ borderColor: LINE }}
                  />
                </div>

                {/* Bouton d'envoi & réassurance RGPD */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white shadow-xs transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 ${R_BUTTON}`}
                    style={{ background: '#ee6018' }}
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Envoi de votre message…</span>
                      </>
                    ) : (
                      <>
                        <span>Envoyer le message</span>
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <div className="mt-4 flex items-center justify-center gap-2 text-[11px]" style={{ color: MUTED }}>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Données confidentielles · Pas de spam · Réponse directe par email</span>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
