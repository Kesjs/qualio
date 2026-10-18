'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline'

type Notification = { id: string; type: string; title: string; body: string; href: string | null; read_at: string | null; created_at: string }

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const unread = items.filter((item) => !item.read_at).length

  async function load() { const response = await fetch('/api/notifications'); if (response.ok) setItems((await response.json()).notifications ?? []) }
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 60000); return () => window.clearInterval(timer) }, [])
  useEffect(() => { const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false) }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close) }, [])

  async function mark(id?: string) { await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(id ? { id } : { all: true }) }); setItems((current) => current.map((item) => id && item.id !== id ? item : { ...item, read_at: new Date().toISOString() })) }

  return <div className="relative" ref={ref}>
    <button type="button" onClick={() => { setOpen((value) => !value); if (!open) void load() }} aria-expanded={open} aria-label={unread ? `${unread} notification${unread > 1 ? 's' : ''} non lue${unread > 1 ? 's' : ''}` : 'Notifications'} className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/90 bg-white text-gray-600 shadow-2xs hover:border-gray-300 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-[#16181E] dark:text-zinc-300 dark:hover:border-white/20"><BellIcon className="h-[18px] w-[18px]" aria-hidden="true" />{unread > 0 && <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#ee6018] px-1 text-[9px] font-bold text-white">{unread > 9 ? '9+' : unread}</span>}</button>
    {open && <div className="absolute right-0 z-50 mt-2 w-[min(calc(100vw-2rem),380px)] overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#111216]"><div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/[0.06]"><strong className="text-sm text-gray-950 dark:text-white">Notifications</strong>{unread > 0 && <button type="button" onClick={() => void mark()} className="text-xs font-semibold text-gray-500 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-white">Tout marquer comme lu</button>}</div><div className="max-h-96 overflow-y-auto">{items.length === 0 ? <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-zinc-400">Aucune notification pour le moment.</p> : items.map((item) => { const content = <div className={`flex gap-3 px-4 py-3 ${!item.read_at ? 'bg-orange-50/60 dark:bg-orange-500/[0.06]' : ''}`}><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.type === 'alert' ? 'bg-red-500' : 'bg-[#ee6018]'}`} /><span className="min-w-0 flex-1"><strong className="block text-xs text-gray-950 dark:text-white">{item.title}</strong><span className="mt-1 block text-xs leading-5 text-gray-600 dark:text-zinc-400">{item.body}</span></span>{!item.read_at && <button type="button" aria-label="Marquer comme lu" onClick={(event) => { event.preventDefault(); event.stopPropagation(); void mark(item.id) }} className="self-start rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white"><CheckIcon className="h-4 w-4" /></button>}</div>; return item.href ? <Link key={item.id} href={item.href} onClick={() => { if (!item.read_at) void mark(item.id); setOpen(false) }}>{content}</Link> : <div key={item.id}>{content}</div> })}</div><Link href="/dashboard/settings?tab=notifications" onClick={() => setOpen(false)} className="block border-t border-gray-100 px-4 py-3 text-xs font-semibold text-gray-600 hover:text-gray-950 dark:border-white/[0.06] dark:text-zinc-400 dark:hover:text-white">Gérer les préférences</Link></div>}
  </div>
}
