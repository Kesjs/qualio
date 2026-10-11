'use client'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-[#fbfbfb] px-6 text-center text-gray-950 dark:bg-[#0b0c0e] dark:text-white"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ee6018]">Un instant</p><h1 className="mt-3 text-3xl font-semibold">La page n’a pas pu s’afficher.</h1><p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">Réessayez. Vos données ne sont pas supprimées.</p><button type="button" onClick={() => reset()} className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#ee6018] px-5 text-sm font-bold text-white">Réessayer</button></div></main>
}
