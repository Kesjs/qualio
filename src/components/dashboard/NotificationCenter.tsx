import { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const notifications: any[] = []

  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={cn(
              "relative flex size-8 items-center justify-center rounded-md border transition-colors",
              open
                ? "border-border-strong bg-elevated text-ink-primary"
                : "border-border bg-surface text-ink-secondary hover:bg-elevated hover:text-ink-primary"
            )}
          >
            <Bell className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-surface p-1 shadow-xl z-50">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-sm font-semibold text-ink-primary">Alertes critiques</span>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:bg-elevated hover:text-ink-primary disabled:opacity-50"
              >
                <CheckCheck className="size-3.5" />
                Tout marquer lu
              </button>
            </div>

            <div className="flex flex-col max-h-[320px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                  <CheckCheck className="mb-2 size-8 text-ink-muted/30" />
                  <p className="text-sm font-medium text-ink-primary">Aucune alerte</p>
                  <p className="mt-1 text-xs text-ink-muted">Tout est au vert !</p>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
