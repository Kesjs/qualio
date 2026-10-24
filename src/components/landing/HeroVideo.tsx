'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { ArrowPathIcon, ArrowsPointingOutIcon, PauseIcon, PlayIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid'
import { Select } from '@/components/dashboard/Select'

const POSTER = '/qualio-hero-poster.webp'
const SRC = '/qualio-final.mp4'

function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

/**
 * Vidéo du hero : affiche tout de suite l'image (poster), se lance quand elle est visible
 * à plus de 50 %, se met en pause quand on la quitte, et reprend là où elle s'était arrêtée.
 * Mouvement réduit : aucune lecture automatique, un bouton play s'affiche.
 */
export function HeroVideo() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const userPaused = useRef(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [ended, setEnded] = useState(false)
  const [started, setStarted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [reduced, setReduced] = useState(false)
  const [awake, setAwake] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1.25)

  const wake = useCallback(() => {
    setAwake(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setAwake(false), 2500)
  }, [])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const wrap = wrapRef.current
    const video = videoRef.current
    if (!wrap || !video) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (!reduced && !userPaused.current && !video.ended) void video.play().catch(() => undefined)
        } else if (!video.paused) {
          video.pause()
        }
      },
      { threshold: [0, 0.5, 1] },
    )
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [reduced])

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current) }, [])

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate
  }, [playbackRate])

  const toggle = () => {
    const video = videoRef.current
    if (!video) return
    if (video.ended) { video.currentTime = 0; setEnded(false) }
    if (video.paused) { userPaused.current = false; void video.play().catch(() => undefined) }
    else { userPaused.current = true; video.pause() }
    wake()
  }

  const seek = (event: PointerEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || !duration) return
    const rect = event.currentTarget.getBoundingClientRect()
    video.currentTime = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) * duration
    setEnded(false)
    setCurrent(video.currentTime)
  }

  const toggleSound = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  const fullscreen = () => {
    const wrap = wrapRef.current
    const video = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null
    if (document.fullscreenElement) { void document.exitFullscreen(); return }
    if (wrap?.requestFullscreen) void wrap.requestFullscreen().catch(() => undefined)
    else video?.webkitEnterFullscreen?.()
  }

  const showControls = !playing || awake
  const showPlayBadge = (!playing && !started) || ended
  const ratio = duration ? (current / duration) * 100 : 0

  return (
    <div
      ref={wrapRef}
      onMouseMove={wake}
      onFocus={wake}
      className="group relative aspect-video w-full overflow-hidden rounded-xl border border-[#e6e6ea] bg-white"
    >
      <video
        ref={videoRef}
        className="block h-full w-full object-cover"
        src={SRC}
        poster={POSTER}
        muted
        playsInline
        preload="auto"
        aria-label="Démonstration de Qualio"
        onClick={toggle}
        onPlay={() => { setPlaying(true); setStarted(true); setEnded(false) }}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setEnded(true) }}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
      />

      {showPlayBadge && (
        <button
          type="button"
          onClick={toggle}
          aria-label={ended ? 'Rejouer la vidéo' : 'Lancer la vidéo'}
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#ee6018] text-white shadow-lg transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2410c] sm:h-20 sm:w-20"
        >
          {ended ? <ArrowPathIcon className="h-7 w-7 sm:h-9 sm:w-9" /> : <PlayIcon className="ml-1 h-7 w-7 sm:h-9 sm:w-9" />}
        </button>
      )}

      {playing && muted && (
        <button
          type="button"
          onClick={toggleSound}
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-gray-950/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2410c]"
        >
          <SpeakerWaveIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Activer le son
        </button>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/55 to-transparent px-3 pb-2.5 pt-8 text-white transition-opacity duration-200 sm:px-4 ${showControls ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Lecture'} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-[#ee6018]">
          {ended ? <ArrowPathIcon className="h-5 w-5" /> : playing ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
        </button>

        <div
          role="slider"
          tabIndex={0}
          aria-label="Progression de la vidéo"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(current)}
          onPointerDown={seek}
          onKeyDown={(event) => {
            const video = videoRef.current
            if (!video) return
            if (event.key === 'ArrowRight') video.currentTime = Math.min(duration, video.currentTime + 5)
            if (event.key === 'ArrowLeft') video.currentTime = Math.max(0, video.currentTime - 5)
          }}
          className="group/bar flex h-6 flex-1 cursor-pointer items-center focus-visible:outline-2 focus-visible:outline-[#ee6018]"
        >
          <div className="relative h-1 w-full rounded-full bg-white/30 transition-all group-hover/bar:h-1.5">
            <div className="absolute inset-y-0 left-0 rounded-full bg-[#ee6018]" style={{ width: `${ratio}%` }} />
          </div>
        </div>

        <span className="shrink-0 font-mono text-[11px] tabular-nums sm:text-xs">{formatTime(current)} / {formatTime(duration)}</span>

        <Select
          label="Vitesse de lecture"
          value={String(playbackRate)}
          onChange={(val) => setPlaybackRate(Number(val))}
          compact
          className="w-20 shrink-0"
          buttonClassName="!min-h-7 !py-0.5 !px-2 !text-[11px] !font-semibold !bg-black/55 !border-white/25 hover:!bg-black/75 !text-white"
          listClassName="!bg-black/95 !border-white/20 !min-w-[95px]"
          options={[
            { value: '0.75', label: '0.75×' },
            { value: '1', label: '1×' },
            { value: '1.25', label: '1.25×' },
            { value: '1.5', label: '1.5×' },
            { value: '2', label: '2×' },
          ]}
        />

        <button type="button" onClick={toggleSound} aria-label={muted ? 'Activer le son' : 'Couper le son'} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-[#ee6018]">
          {muted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
        </button>
        <button type="button" onClick={fullscreen} aria-label="Plein écran" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-[#ee6018]">
          <ArrowsPointingOutIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
