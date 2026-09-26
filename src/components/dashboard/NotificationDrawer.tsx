'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  BellIcon,
} from '@heroicons/react/24/outline'

export interface NotificationItem {
  id: string
  type: 'scan_completed' | 'regression_alert' | 'system'
  title: string
  message: string
  timestamp: string
  read: boolean
  link?: string
}

interface NotificationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'regression_alert',
    title: 'Régression critique détectée',
    message: '2 anomalies critiques identifiées sur le checkout lors de la dernière session Playwright.',
    timestamp: 'Il y a 10 min',
    read: false,
    link: '/dashboard/bugs',
  },
  {
    id: 'notif-2',
    type: 'scan_completed',
    title: 'Scan terminé avec succès',
    message: 'acme-store.com : 42 assertions Playwright validées en 42s (0 échec).',
    timestamp: 'Il y a 1h',
    read: false,
    link: '/dashboard/scans',
  },
  {
    id: 'notif-3',
    type: 'system',
    title: 'Moteur Playwright opérationnel',
    message: 'Chromium headless v1.63 prêt pour vos tests automatisés programmés.',
    timestamp: 'Il y a 3h',
    read: true,
  },
  {
    id: 'notif-4',
    type: 'scan_completed',
    title: 'Cartographie initiale effectuée',
    message: '18 pages explorées sur staging.qualio.dev. Aucune rupture 404/500 détectée.',
    timestamp: 'Hier à 18:30',
    read: true,
    link: '/dashboard/sites',
  },
]

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [filter, setFilter] = useState<'all' | 'alerts' | 'scans'>('all')

  if (!isOpen) return null

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'alerts') return n.type === 'regression_alert'
    if (filter === 'scans') return n.type === 'scan_completed'
    return true
  })

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/30 dark:bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform bg-white dark:bg-[#111216] shadow-2xl transition-all flex flex-col border-l border-gray-200 dark:border-white/[0.08]">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-orange-50 text-[#ee6018] dark:bg-[#ee6018]/15 dark:text-[#ff7836] flex items-center justify-center">
                <BellIcon className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white font-sans">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#ee6018] text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500">Alertes temps réel & rapports Playwright</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Tout marquer comme lu"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-white/[0.06] transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center px-5 pt-3 gap-2 border-b border-gray-100 dark:border-white/[0.06] pb-3">
            {(['all', 'alerts', 'scans'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors capitalize ${
                  filter === tab
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-[#16181E] dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
                }`}
              >
                {tab === 'all' ? 'Toutes' : tab === 'alerts' ? 'Alertes' : 'Scans'}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-xs text-gray-400 dark:text-zinc-500">
                <BellIcon className="h-8 w-8 text-gray-300 dark:text-zinc-700 mx-auto mb-2" />
                <span>Aucune notification pour le moment</span>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    item.read
                      ? 'bg-white border-gray-200/80 hover:border-gray-300 dark:bg-[#16181E] dark:border-white/[0.06] dark:hover:border-white/[0.14]'
                      : 'bg-orange-50/20 border-orange-200/80 shadow-xs dark:bg-[#ee6018]/10 dark:border-[#ee6018]/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {item.type === 'regression_alert' ? (
                        <div className="h-7 w-7 rounded-lg bg-red-50 text-red-600 dark:bg-rose-500/15 dark:text-rose-400 flex items-center justify-center">
                          <ExclamationTriangleIcon className="h-4 w-4" />
                        </div>
                      ) : item.type === 'scan_completed' ? (
                        <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 flex items-center justify-center">
                          <CheckCircleIcon className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-lg bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-zinc-300 flex items-center justify-center">
                          <ClockIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500 shrink-0">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1 leading-relaxed">
                        {item.message}
                      </p>

                      {item.link && (
                        <div className="mt-2.5">
                          <Link
                            href={item.link}
                            onClick={onClose}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#ee6018] dark:text-[#ff7836] hover:underline"
                          >
                            <span>Inspecter le rapport</span>
                            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-rose-400 transition-colors"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                <span>Effacer tout</span>
              </button>

              <span className="text-[11px] text-gray-400 dark:text-zinc-500">
                {notifications.length} message(s)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
