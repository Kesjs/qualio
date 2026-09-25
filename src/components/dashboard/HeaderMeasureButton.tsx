import { useState } from 'react'
import { toast } from 'sonner'
import { Gauge, Loader2, X } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function HeaderMeasureButton() {
  const [pending, setPending] = useState(false)

  async function handleClick() {
    setPending(true)
    setTimeout(() => {
      setPending(false)
      toast.success('Mesure terminée !')
    }, 2000)
  }

  if (pending) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setPending(false)}
            className="group flex size-8 sm:h-8 sm:w-auto items-center justify-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 sm:px-3 text-[11px] font-semibold text-warning transition-colors hover:bg-danger/10 hover:text-danger hover:border-danger/40"
          >
            <Loader2 className="size-3.5 animate-spin group-hover:hidden" />
            <X className="size-3.5 hidden group-hover:block" />
            <span className="hidden sm:inline group-hover:hidden">Mesure…</span>
            <span className="hidden sm:group-hover:inline">Annuler</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>Annuler la mesure en cours</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          className="flex size-8 sm:h-8 sm:w-auto items-center justify-center gap-1.5 rounded-md bg-brand sm:px-3 text-[11px] font-semibold text-black transition-colors hover:bg-brand-hover"
        >
          <Gauge className="size-3.5" />
          <span className="hidden sm:inline">Mesurer</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>Lancer une nouvelle mesure</TooltipContent>
    </Tooltip>
  )
}
