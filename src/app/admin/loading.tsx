/** Affiché pendant le chargement d'une page admin : la navigation répond tout de suite, la mise en page ne saute pas. */
export default function AdminLoading() {
  const bar = 'rounded-lg bg-white/[0.07] motion-safe:animate-pulse'
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-7xl space-y-8">
      <span className="sr-only">Chargement de la page…</span>
      <div aria-hidden="true" className="space-y-3 border-b border-white/10 pb-6"><div className={`${bar} h-3 w-28`} /><div className={`${bar} h-9 w-72 max-w-full`} /><div className={`${bar} h-4 w-96 max-w-full`} /></div>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className={`${bar} h-32 rounded-2xl`} />)}</div>
      <div aria-hidden="true" className={`${bar} h-72 rounded-2xl`} />
    </div>
  )
}
