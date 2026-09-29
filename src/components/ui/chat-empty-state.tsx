'use client'

import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SuggestedPrompt {
  id: string
  label: string
  prompt?: string
}

interface ChatEmptyStateProps {
  title: string
  subtitle: string
  prompts: SuggestedPrompt[]
  onSelectPrompt?: (prompt: SuggestedPrompt) => void
  className?: string
}

export function ChatEmptyState({ title, subtitle, prompts, onSelectPrompt, className }: ChatEmptyStateProps) {
  return (
    <section className={cn('w-full max-w-2xl mx-auto rounded-2xl border border-gray-200/80 bg-white/80 p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] backdrop-blur-sm dark:border-white/[0.08] dark:bg-[#14161C]/70 dark:shadow-[0_4px_24px_rgba(0,0,0,0.28)]', className)} aria-labelledby="qa-empty-title">
      <style>{`@keyframes qualio-prompt-in { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }`}</style>
      <div className="grid size-10 place-items-center rounded-xl border border-[#ee6018]/20 bg-[#ee6018]/10 text-[#ee6018] dark:border-[#ee6018]/30 dark:bg-[#ee6018]/10">
        <Sparkles className="size-4" aria-hidden="true" />
      </div>
      <h2 id="qa-empty-title" className="mt-4 text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500 dark:text-zinc-400">
        {subtitle}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={prompt.id}
            type="button"
            onClick={() => onSelectPrompt?.(prompt)}
            style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}
            className="motion-safe:animate-[qualio-prompt-in_240ms_cubic-bezier(0.23,1,0.32,1)_both] rounded-full border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-600 transition-[color,border-color,transform,background] duration-150 hover:-translate-y-0.5 hover:border-[#ee6018]/40 hover:bg-[#ee6018]/5 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018]/40 active:scale-[0.97] dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-[#ee6018]/50 dark:hover:bg-[#ee6018]/10 dark:hover:text-white"
          >
            {prompt.label}
          </button>
        ))}
      </div>
    </section>
  )
}

export default ChatEmptyState
