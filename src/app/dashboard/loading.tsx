export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Chargement du tableau de bord">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#ee6018] dark:border-white/[0.12] dark:border-t-[#ee6018]" />
      <span className="sr-only">Chargement du tableau de bord…</span>
    </div>
  )
}
