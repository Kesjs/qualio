'use client'

import { createRoot } from 'react-dom/client'
import { useEffect, useId, useRef, useState } from 'react'
import { inputClass, primaryButton, secondaryButton } from './ui'

/** Shared, themed dialogs with native focus containment and Escape support. */
function ask(message: string, prompt: boolean): Promise<string | null> {
  return new Promise((resolve) => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    const previous = document.activeElement as HTMLElement | null
    let finished = false
    const finish = (value: string | null) => {
      if (finished) return
      finished = true
      resolve(value)
      queueMicrotask(() => { root.unmount(); host.remove(); previous?.focus() })
    }
    root.render(<Question message={message} prompt={prompt} finish={finish} />)
  })
}

function Question({ message, prompt, finish }: { message: string; prompt: boolean; finish: (value: string | null) => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()
  const [value, setValue] = useState('')
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => { dialog?.close() } }, [])
  return <dialog ref={ref} role="dialog" aria-labelledby={id} onCancel={(event) => { event.preventDefault(); finish(null) }} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md overflow-auto rounded-2xl border border-gray-200 bg-white p-6 text-gray-950 shadow-xl backdrop:bg-black/60 dark:border-white/15 dark:bg-[#181B21] dark:text-white">
    <form onSubmit={(event) => { event.preventDefault(); finish(prompt ? value.trim() : 'confirmed') }} className="space-y-5">
      <h2 id={id} className="text-lg font-semibold">{prompt ? 'Créer un thème' : 'Confirmer l’action'}</h2>
      <p className="whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-zinc-300">{message}</p>
      {prompt && <label className="block text-sm">Nom du thème<input autoFocus required maxLength={120} value={value} onChange={(event) => setValue(event.target.value)} className={`${inputClass} mt-2`} /></label>}
      <div className="flex flex-wrap justify-end gap-3"><button autoFocus={!prompt} type="button" onClick={() => finish(null)} className={secondaryButton}>Annuler</button><button type="submit" disabled={prompt && !value.trim()} className={primaryButton}>{prompt ? 'Créer le thème' : 'Confirmer'}</button></div>
    </form>
  </dialog>
}

export async function confirmAction(message: string) { return (await ask(message, false)) !== null }
export function promptText(message: string) { return ask(message, true) }
