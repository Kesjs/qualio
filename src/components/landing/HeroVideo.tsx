'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import {
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid'
import { Select } from '@/components/dashboard/Select'

const AUDIO_SRC = '/qualio-voiceover.wav'
const TOTAL_DURATION = 26.7

interface Chapter {
  id: number
  title: string
  subtitle: string
  start: number
  end: number
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: '1. Le Chaos',
    subtitle: 'Avis éparpillés sans priorité',
    start: 0,
    end: 8.2,
  },
  {
    id: 2,
    title: '2. Thématiques',
    subtitle: 'Regroupement sémantique par IA',
    start: 8.2,
    end: 14.5,
  },
  {
    id: 3,
    title: '3. Recommandation',
    subtitle: 'Action chiffrée et sourcée',
    start: 14.5,
    end: 19.5,
  },
  {
    id: 4,
    title: '4. Décision',
    subtitle: 'Validation en 1 clic',
    start: 19.5,
    end: 23.3,
  },
  {
    id: 5,
    title: '5. Impact',
    subtitle: 'Croissance et résultat mesuré',
    start: 23.3,
    end: 26.7,
  },
]

const SUBTITLES = [
  { start: 0.0, end: 8.2, text: 'Vos avis clients arrivent de partout : Stripe, Trustpilot, support... Des centaines de retours, mais aucune priorité claire.' },
  { start: 8.2, end: 14.5, text: 'Qualio regroupe automatiquement chaque signal par thématique et fait émerger les vrais points de friction.' },
  { start: 14.5, end: 19.5, text: 'Une recommandation concrète, chiffrée, et directement appuyée sur les citations de vos clients.' },
  { start: 19.5, end: 23.3, text: "En un clic, vous validez l'action et suivez son impact." },
  { start: 23.3, end: 26.7, text: 'Qualio. Transformez vos avis en décisions concrètes.' },
]

function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

export function HeroVideo() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const userPaused = useRef(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [ended, setEnded] = useState(false)
  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(TOTAL_DURATION)
  const [reduced, setReduced] = useState(false)
  const [awake, setAwake] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [activeVoice, setActiveVoice] = useState('/qualio-voiceover.wav')
  const [showCaptions, setShowCaptions] = useState(true)

  // Raf loop for silky smooth UI progress & scene synchronicity
  const syncLoop = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      setCurrent(audioRef.current.currentTime)
      rafRef.current = requestAnimationFrame(syncLoop)
    }
  }, [])

  const wake = useCallback(() => {
    setAwake(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setAwake(false), 3000)
  }, [])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  // Auto-pause when leaving viewport
  useEffect(() => {
    const wrap = wrapRef.current
    const audio = audioRef.current
    if (!wrap || !audio) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          if (!reduced && !userPaused.current && !audio.ended && started) {
            void audio.play().catch(() => undefined)
          }
        } else if (!audio.paused) {
          audio.pause()
        }
      },
      { threshold: [0, 0.45, 1] },
    )
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [reduced, started])

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.ended || current >= duration - 0.2) {
      audio.currentTime = 0
      setEnded(false)
      setCurrent(0)
    }
    if (audio.paused) {
      userPaused.current = false
      void audio.play().then(() => {
        setPlaying(true)
        setStarted(true)
        setEnded(false)
        rafRef.current = requestAnimationFrame(syncLoop)
      }).catch(() => undefined)
    } else {
      userPaused.current = true
      audio.pause()
      setPlaying(false)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    wake()
  }

  const seek = (event: PointerEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = event.currentTarget.getBoundingClientRect()
    const target = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) * duration
    audio.currentTime = target
    setEnded(false)
    setCurrent(target)
    wake()
  }

  const jumpToChapter = (start: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = start
    setCurrent(start)
    setEnded(false)
    if (audio.paused) {
      userPaused.current = false
      void audio.play().then(() => {
        setPlaying(true)
        setStarted(true)
        rafRef.current = requestAnimationFrame(syncLoop)
      }).catch(() => undefined)
    }
    wake()
  }

  const toggleSound = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !audio.muted
    setMuted(audio.muted)
    wake()
  }

  const fullscreen = () => {
    const wrap = wrapRef.current
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else if (wrap?.requestFullscreen) {
      void wrap.requestFullscreen().catch(() => undefined)
    }
  }

  // Active scene calculation
  const currentChapter = CHAPTERS.find((c) => current >= c.start && current < c.end) || CHAPTERS[CHAPTERS.length - 1]
  const currentSubtitle = SUBTITLES.find((s) => current >= s.start && current <= s.end)?.text || ''
  const ratio = duration ? (current / duration) * 100 : 0
  const showControls = !playing || awake
  const showPlayBadge = (!playing && !started) || ended

  // Visual sub-progress within active scene (0 to 1)
  const sceneProgress = Math.min(
    1,
    Math.max(0, (current - currentChapter.start) / Math.max(0.1, currentChapter.end - currentChapter.start)),
  )

  return (
    <div
      ref={wrapRef}
      onMouseMove={wake}
      onFocus={wake}
      className="group relative aspect-[16/9] w-full select-none overflow-hidden rounded-2xl border border-[#e6e6ea] bg-[#0b0b0c] text-neutral-900 shadow-2xl transition-all"
    >
      {/* Native HTML5 Audio element driving the master clock with Gemini TTS French Voice */}
      <audio
        ref={audioRef}
        src={activeVoice}
        muted={muted}
        preload="auto"
        onPlay={() => {
          setPlaying(true)
          setStarted(true)
          setEnded(false)
          rafRef.current = requestAnimationFrame(syncLoop)
        }}
        onPause={() => {
          setPlaying(false)
          if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }}
        onEnded={() => {
          setPlaying(false)
          setEnded(true)
          if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }}
        onLoadedMetadata={(e) => {
          if (e.currentTarget.duration) setDuration(e.currentTarget.duration)
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
      />

      {/* ── TOP NAV BAR INSIDE PLAYER (Chapter Pills + Audio Equalizer) ── */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b border-white/10 bg-gradient-to-b from-black/85 via-black/45 to-transparent px-4 py-3 text-white backdrop-blur-xs sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#ee6018]">
            <span className="font-mono text-xs font-bold text-white">Q</span>
          </div>
          <span className="text-xs font-semibold tracking-tight text-white/95 sm:text-sm">
            Qualio en action <span className="hidden text-white/40 sm:inline">· Démonstration narrative</span>
          </span>
        </div>

        {/* Chapters timeline quick jumper */}
        <div className="hidden items-center gap-1.5 md:flex">
          {CHAPTERS.map((ch) => {
            const isActive = currentChapter.id === ch.id
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => jumpToChapter(ch.start)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  isActive
                    ? 'bg-[#ee6018] text-white shadow-sm shadow-[#ee6018]/50'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                {ch.title}
              </button>
            )
          })}
        </div>

        {/* Audio voice indicator badge */}
        <div className="flex items-center gap-2">
          {playing && !muted && (
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/40">
              <span className="flex items-center gap-0.5">
                <span className="inline-block h-2 w-0.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="inline-block h-3 w-0.5 animate-pulse rounded-full bg-emerald-400 [animation-delay:0.15s]" />
                <span className="inline-block h-2 w-0.5 animate-pulse rounded-full bg-emerald-400 [animation-delay:0.3s]" />
              </span>
              <span className="ml-1 hidden font-mono sm:inline">Voix FR</span>
            </div>
          )}
          {muted && (
            <button
              type="button"
              onClick={toggleSound}
              className="flex items-center gap-1.5 rounded-full bg-[#ee6018] px-3 py-1 text-xs font-semibold text-white shadow-md transition hover:bg-[#c2410c] active:scale-95"
            >
              <SpeakerWaveIcon className="h-3.5 w-3.5" />
              <span>Activer la voix française</span>
            </button>
          )}
        </div>
      </div>

      {/* ── STAGE CANVAS (Visual Presentation of the 5 Acts) ── */}
      <div className="relative h-full w-full bg-[#FBFBFC] pt-14 pb-16 font-sans">
        {/* Subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: 'radial-gradient(circle, #e2e4e9 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* ══════════ ACT 1: LE CHAOS DES RETOURS (0s - 8.2s) ══════════ */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-700 ${
            currentChapter.id === 1 ? 'pointer-events-auto opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'
          }`}
        >
          {/* Header pill */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50/90 px-3.5 py-1 text-xs font-semibold text-red-700 shadow-xs backdrop-blur-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span>Boîte de réception · 148 avis éparpillés sans priorité</span>
          </div>

          <h3 className="mb-6 max-w-xl text-center text-xl font-bold tracking-tight text-[#0B0B0C] sm:text-2xl md:text-3xl">
            Des avis partout, <span className="text-[#ee6018] italic">aucune direction claire</span>.
          </h3>

          {/* Scattered realistic review cards */}
          <div className="relative h-56 w-full max-w-3xl sm:h-64">
            {/* Card 1: Stripe */}
            <div
              className="absolute left-2 top-0 w-64 rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-lg transition-all duration-500 sm:left-6 sm:w-72"
              style={{
                transform: `rotate(-4deg) translateY(${Math.sin(sceneProgress * 4) * 4}px)`,
                opacity: sceneProgress > 0.1 ? 1 : 0,
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded bg-[#635BFF]/10 px-2 py-0.5 text-[10px] font-bold text-[#635BFF]">
                  Stripe
                </span>
                <span className="text-[11px] font-medium text-amber-500">★★☆☆☆</span>
              </div>
              <p className="text-xs font-medium text-neutral-800 leading-snug">
                « Le checkout boucle à l&apos;infini sur Safari mobile au paiement. 3 abandons de panier constatés. »
              </p>
              <div className="mt-2 text-[10px] text-neutral-500">Julien M. · Client e-commerce</div>
            </div>

            {/* Card 2: Trustpilot */}
            <div
              className="absolute right-2 top-2 w-64 rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-lg transition-all duration-500 sm:right-6 sm:w-72"
              style={{
                transform: `rotate(3deg) translateY(${Math.cos(sceneProgress * 4) * 4}px)`,
                opacity: sceneProgress > 0.25 ? 1 : 0,
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded bg-[#00B67A]/10 px-2 py-0.5 text-[10px] font-bold text-[#00B67A]">
                  Trustpilot
                </span>
                <span className="text-[11px] font-medium text-amber-500">★☆☆☆☆</span>
              </div>
              <p className="text-xs font-medium text-neutral-800 leading-snug">
                « Impossible d&apos;éditer ma facture avec notre numéro de TVA intracommunautaire. Très pénalisant ! »
              </p>
              <div className="mt-2 text-[10px] text-neutral-500">Clara D. · Agence B2B</div>
            </div>

            {/* Card 3: Intercom */}
            <div
              className="absolute bottom-2 left-10 w-64 rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-lg transition-all duration-500 sm:left-24 sm:w-72"
              style={{
                transform: `rotate(-2deg) translateY(${Math.sin(sceneProgress * 3.5 + 1) * 3}px)`,
                opacity: sceneProgress > 0.4 ? 1 : 0,
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-600">
                  Intercom
                </span>
                <span className="text-[11px] font-medium text-amber-500">★★☆☆☆</span>
              </div>
              <p className="text-xs font-medium text-neutral-800 leading-snug">
                « Délai de réponse du support supérieur à 48h sur un problème de synchronisation webhook. »
              </p>
              <div className="mt-2 text-[10px] text-neutral-500">Karim B. · Développeur</div>
            </div>

            {/* Card 4: CSV Import */}
            <div
              className="hidden sm:block absolute bottom-0 right-14 w-68 rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-lg transition-all duration-500"
              style={{
                transform: `rotate(4deg) translateY(${Math.cos(sceneProgress * 3.5 + 2) * 3}px)`,
                opacity: sceneProgress > 0.55 ? 1 : 0,
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                  Import CSV
                </span>
                <span className="text-[11px] font-medium text-amber-500">★★★☆☆</span>
              </div>
              <p className="text-xs font-medium text-neutral-800 leading-snug">
                « 80 retours récents dans un tableur, mais personne n&apos;a le temps de les décortiquer. »
              </p>
              <div className="mt-2 text-[10px] text-neutral-500">Sophie T. · Head of Ops</div>
            </div>
          </div>
        </div>

        {/* ══════════ ACT 2: ORGANISATION THÉMATIQUE (8.2s - 14.5s) ══════════ */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-700 ${
            currentChapter.id === 2 ? 'pointer-events-auto opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'
          }`}
        >
          {/* AI Banner */}
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1 text-xs font-semibold text-[#c2410c] shadow-xs">
            <SparklesIcon className="h-3.5 w-3.5 text-[#ee6018]" />
            <span>Moteur sémantique Qualio · 3 clusters de friction isolés</span>
          </div>

          <h3 className="mb-6 max-w-xl text-center text-xl font-bold tracking-tight text-[#0B0B0C] sm:text-2xl md:text-3xl">
            Chaque signal <span className="text-[#ee6018]">automatiquement regroupé</span> par enjeu.
          </h3>

          {/* 3 Theme Columns */}
          <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {/* Theme 1: Facturation (High priority) */}
            <div
              className="relative overflow-hidden rounded-xl border-2 border-[#ee6018]/40 bg-white p-4 shadow-md transition-all duration-500"
              style={{
                transform: sceneProgress > 0.15 ? 'translateY(0)' : 'translateY(20px)',
                opacity: sceneProgress > 0.15 ? 1 : 0,
              }}
            >
              <div className="absolute right-0 top-0 rounded-bl-lg bg-[#ee6018] px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                Priorité P0
              </div>
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-lg">
                💳
              </div>
              <h4 className="text-sm font-bold text-neutral-900">Facturation & Checkout</h4>
              <p className="mt-1 text-[11px] text-neutral-500">42 avis récents · 68% négatifs</p>
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-[#ee6018]" style={{ width: '82%' }} />
                </div>
                <span className="mt-1.5 block text-[10px] font-semibold text-[#c2410c]">
                  Friction directe sur le chiffre d&apos;affaires
                </span>
              </div>
            </div>

            {/* Theme 2: Support */}
            <div
              className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-500"
              style={{
                transform: sceneProgress > 0.35 ? 'translateY(0)' : 'translateY(20px)',
                opacity: sceneProgress > 0.35 ? 1 : 0,
              }}
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-lg">
                🎧
              </div>
              <h4 className="text-sm font-bold text-neutral-900">Support & Délais</h4>
              <p className="mt-1 text-[11px] text-neutral-500">29 avis récents · 45% neutres</p>
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: '54%' }} />
                </div>
                <span className="mt-1.5 block text-[10px] font-medium text-neutral-600">
                  Délai moyen de réponse &gt; 36h
                </span>
              </div>
            </div>

            {/* Theme 3: Intégrations */}
            <div
              className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-500"
              style={{
                transform: sceneProgress > 0.55 ? 'translateY(0)' : 'translateY(20px)',
                opacity: sceneProgress > 0.55 ? 1 : 0,
              }}
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-lg">
                🔌
              </div>
              <h4 className="text-sm font-bold text-neutral-900">Intégrations & API</h4>
              <p className="mt-1 text-[11px] text-neutral-500">18 avis récents · 74% positifs</p>
              <div className="mt-3">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: '38%' }} />
                </div>
                <span className="mt-1.5 block text-[10px] font-medium text-neutral-600">
                  Documentation webhooks attendue
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ ACT 3: LA RECOMMANDATION SOURCÉE (14.5s - 19.5s) ══════════ */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-700 ${
            currentChapter.id === 3 ? 'pointer-events-auto opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'
          }`}
        >
          {/* Executive Action Card */}
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1e9] px-3 py-0.5 text-xs font-bold text-[#c2410c]">
                ✦ Recommandation IA Qualio #1
              </span>
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
                  Score Qualio : 94/100
                </span>
                <span className="font-mono text-xs font-semibold text-neutral-500">
                  Gain : +14% conversion
                </span>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-bold text-neutral-900 sm:text-xl">
                Résoudre l&apos;échec 3DS sur Safari & ajouter l&apos;édition du numéro de TVA
              </h3>
              <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
                42 retours clients convergent directement sur ce point de friction critique.
              </p>
            </div>

            {/* Verbatim quote cards */}
            <div className="mt-4 space-y-2">
              <div className="rounded-lg border-l-4 border-[#ee6018] bg-neutral-50 p-2.5 text-xs text-neutral-700">
                <p className="italic">
                  « Le checkout boucle à l&apos;infini sur Safari mobile... 3 abandons de panier constatés. »
                </p>
                <span className="mt-1 block font-mono text-[10px] text-neutral-500">
                  — Julien M. · Stripe Checkout · Verbatim vérifié
                </span>
              </div>
              <div className="hidden rounded-lg border-l-4 border-amber-500 bg-neutral-50 p-2.5 text-xs text-neutral-700 sm:block">
                <p className="italic">
                  « Impossible d&apos;éditer ma facture avec notre numéro de TVA intracommunautaire... »
                </p>
                <span className="mt-1 block font-mono text-[10px] text-neutral-500">
                  — Clara D. · Trustpilot · Verbatim vérifié
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-2 text-xs text-neutral-600">
              <span className="font-medium">Effort technique estimé : ~2h</span>
              <span className="font-semibold text-emerald-600">Impact immédiat sur les ventes</span>
            </div>
          </div>
        </div>

        {/* ══════════ ACT 4: LA DÉCISION EN 1 CLIC (19.5s - 23.3s) ══════════ */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-700 ${
            currentChapter.id === 4 ? 'pointer-events-auto opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'
          }`}
        >
          {/* Action card with dynamic click state */}
          <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl sm:p-7">
            {/* Virtual cursor floating & clicking */}
            <div
              className="pointer-events-none absolute z-50 transition-all duration-700"
              style={{
                left: sceneProgress < 0.35 ? '75%' : '28%',
                top: sceneProgress < 0.35 ? '80%' : '76%',
                transform: `scale(${sceneProgress >= 0.45 && sceneProgress <= 0.65 ? 0.85 : 1})`,
              }}
            >
              <div className="relative">
                <svg className="h-6 w-6 text-neutral-900 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3l7 18 3-7 7-3L3 3z" />
                </svg>
                <span className="absolute -right-20 -top-4 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
                  Ken (Fondateur)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Phase de décision
              </span>
              {sceneProgress >= 0.5 ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800 animate-in fade-in zoom-in duration-300">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                  Validé et assigné
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800">
                  En attente d&apos;arbitrage
                </span>
              )}
            </div>

            <h3 className="mt-3 text-lg font-bold text-neutral-900 sm:text-xl">
              Résoudre l&apos;échec 3DS Safari & ajouter le champ TVA
            </h3>

            {/* Simulated interactive buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                  sceneProgress >= 0.5
                    ? 'bg-emerald-600 text-white shadow-lg ring-4 ring-emerald-100 scale-102'
                    : 'bg-emerald-500 text-white shadow-sm'
                }`}
              >
                <CheckCircleIcon className="h-4 w-4" />
                <span>Valider &amp; Assigner à Thomas</span>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-medium text-neutral-600 sm:text-sm">
                Reporter au sprint
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-xs font-medium text-neutral-600 sm:text-sm">
                Écarter
              </div>
            </div>

            {/* Notification Toast */}
            {sceneProgress >= 0.5 && (
              <div className="mt-5 flex items-center justify-between rounded-xl bg-neutral-900 px-4 py-2.5 text-xs text-white shadow-md animate-in slide-in-from-bottom-2 duration-300">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Ticket synchronisé avec Linear &amp; notification Slack envoyée</span>
                </span>
                <span className="font-mono text-[10px] text-neutral-400">À l&apos;instant</span>
              </div>
            )}
          </div>
        </div>

        {/* ══════════ ACT 5: IMPACT & CROISSANCE (23.3s - 26.7s) ══════════ */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-all duration-700 ${
            currentChapter.id === 5 ? 'pointer-events-auto opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'
          }`}
        >
          {/* Logo brand icon */}
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ee6018] shadow-lg shadow-[#ee6018]/30">
            <span className="font-mono text-2xl font-black text-white">Q</span>
          </div>

          <h3 className="text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl md:text-4xl">
            Transformez vos avis en <span className="text-[#ee6018]">décisions concrètes</span>.
          </h3>
          <p className="mt-2 max-w-md text-xs text-neutral-600 sm:text-sm">
            Fini le bruit et les feuilles de calcul. Qualio vous donne une direction nette chaque semaine.
          </p>

          {/* 3 Metric Pills */}
          <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-6">
            <div className="rounded-xl border border-neutral-200 bg-white p-2.5 shadow-sm sm:p-4">
              <span className="font-mono text-base font-bold text-neutral-900 sm:text-xl">148</span>
              <span className="mt-0.5 block text-[10px] text-neutral-500 sm:text-xs">Avis traités</span>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-2.5 shadow-sm sm:p-4">
              <span className="font-mono text-base font-bold text-[#ee6018] sm:text-xl">1 clic</span>
              <span className="mt-0.5 block text-[10px] text-neutral-500 sm:text-xs">Pour décider</span>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-2.5 shadow-sm sm:p-4">
              <span className="font-mono text-base font-bold text-emerald-600 sm:text-xl">+14 %</span>
              <span className="mt-0.5 block text-[10px] text-neutral-500 sm:text-xs">Conversion</span>
            </div>
          </div>

          {/* Replay button */}
          <button
            type="button"
            onClick={toggle}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ee6018] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#c2410c] hover:scale-105 active:scale-95 sm:text-sm"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>Rejouer la démonstration</span>
          </button>
        </div>
      </div>

      {/* ── BIG CENTRAL PLAY / REPLAY BADGE ── */}
      {showPlayBadge && (
        <button
          type="button"
          onClick={toggle}
          aria-label={ended ? 'Rejouer la démonstration' : 'Lancer la démonstration'}
          className="absolute left-1/2 top-1/2 z-40 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#ee6018] text-white shadow-2xl ring-8 ring-white/20 transition-all hover:scale-110 active:scale-95 sm:h-20 sm:w-20"
        >
          {ended ? (
            <ArrowPathIcon className="h-8 w-8 sm:h-9 sm:w-9" />
          ) : (
            <PlayIcon className="ml-1 h-8 w-8 sm:h-9 sm:w-9" />
          )}
        </button>
      )}

      {/* ── LIVE SUBTITLES BAR (Dynamic French Subtitles) ── */}
      {showCaptions && currentSubtitle && (
        <div className="pointer-events-none absolute inset-x-4 bottom-14 z-30 flex justify-center text-center">
          <div className="max-w-xl rounded-xl bg-black/80 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-all sm:text-sm">
            {currentSubtitle}
          </div>
        </div>
      )}

      {/* ── BOTTOM CONTROL BAR (Play/Pause, Scrubber, Time, Voice, Fullscreen) ── */}
      <div
        className={`absolute inset-x-0 bottom-0 z-30 flex items-center gap-2.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pb-2.5 pt-8 text-white transition-opacity duration-300 sm:gap-3.5 sm:px-5 ${
          showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {/* Play / Pause toggle */}
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Mettre en pause' : 'Lancer la lecture'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-[#ee6018]"
        >
          {ended ? (
            <ArrowPathIcon className="h-5 w-5" />
          ) : playing ? (
            <PauseIcon className="h-5 w-5" />
          ) : (
            <PlayIcon className="h-5 w-5" />
          )}
        </button>

        {/* Progress scrub bar with chapter dividers */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Progression de la démonstration"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          onPointerDown={seek}
          onKeyDown={(event) => {
            const audio = audioRef.current
            if (!audio) return
            if (event.key === 'ArrowRight') audio.currentTime = Math.min(duration, audio.currentTime + 5)
            if (event.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5)
          }}
          className="group/bar relative flex h-6 flex-1 cursor-pointer items-center focus-visible:outline-2 focus-visible:outline-[#ee6018]"
        >
          <div className="relative h-1.5 w-full rounded-full bg-white/25 transition-all group-hover/bar:h-2">
            {/* Filled bar */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[#ee6018] transition-all"
              style={{ width: `${ratio}%` }}
            />
            {/* Chapter tick marks */}
            {CHAPTERS.slice(1).map((ch) => (
              <div
                key={ch.id}
                className="absolute top-0 h-full w-0.5 -translate-x-1/2 bg-white/40"
                style={{ left: `${(ch.start / duration) * 100}%` }}
              />
            ))}
          </div>
        </div>

        {/* Time code */}
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-white/90 sm:text-xs">
          {formatTime(current)} / {formatTime(duration)}
        </span>

        {/* Voice selector */}
        <Select
          label="Voix de narration"
          value={activeVoice}
          onChange={(val) => {
            setActiveVoice(val)
            const audio = audioRef.current
            if (audio) {
              const prevTime = audio.currentTime
              const wasPlaying = !audio.paused
              audio.src = val
              audio.currentTime = prevTime
              if (wasPlaying) void audio.play().catch(() => undefined)
            }
          }}
          compact
          className="hidden w-28 shrink-0 sm:block"
          buttonClassName="!min-h-7 !py-0.5 !px-2 !text-[11px] !font-semibold !bg-black/55 !border-white/20 hover:!bg-black/75 !text-white"
          listClassName="!bg-black/95 !border-white/20 !min-w-[150px]"
          options={[
            { value: '/qualio-voiceover.wav', label: 'Voix FR (Warm)' },
            { value: '/qualio-voiceover-fr-fr-advisor-2.wav', label: 'Voix FR (Expert)' },
            { value: '/qualio-voiceover-fr-fr-podcaster-2.wav', label: 'Voix FR (Radio)' },
          ]}
        />

        {/* Playback speed */}
        <Select
          label="Vitesse"
          value={String(playbackRate)}
          onChange={(val) => setPlaybackRate(Number(val))}
          compact
          className="hidden w-16 shrink-0 sm:block"
          buttonClassName="!min-h-7 !py-0.5 !px-2 !text-[11px] !font-semibold !bg-black/55 !border-white/20 hover:!bg-black/75 !text-white"
          listClassName="!bg-black/95 !border-white/20 !min-w-[80px]"
          options={[
            { value: '0.75', label: '0.75×' },
            { value: '1', label: '1×' },
            { value: '1.25', label: '1.25×' },
            { value: '1.5', label: '1.5×' },
          ]}
        />

        {/* Captions toggle */}
        <button
          type="button"
          onClick={() => setShowCaptions((prev) => !prev)}
          title={showCaptions ? 'Masquer les sous-titres' : 'Afficher les sous-titres'}
          className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-full sm:flex ${
            showCaptions ? 'text-white' : 'text-white/40'
          } hover:bg-white/15`}
        >
          <span className="font-mono text-xs font-bold border border-current px-1 py-0.2 rounded">CC</span>
        </button>

        {/* Mute / Unmute */}
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? 'Activer le son' : 'Couper le son'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-[#ee6018]"
        >
          {muted ? (
            <SpeakerXMarkIcon className="h-5 w-5 text-amber-400" />
          ) : (
            <SpeakerWaveIcon className="h-5 w-5 text-emerald-400" />
          )}
        </button>

        {/* Fullscreen toggle */}
        <button
          type="button"
          onClick={fullscreen}
          aria-label="Mode plein écran"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-[#ee6018]"
        >
          <ArrowsPointingOutIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
