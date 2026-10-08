'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStartScan } from '@/lib/hooks/useScan'
import type { DiscoveredForm, FormSelection } from '@/lib/qa/types'
import { FormDiscoveryStep } from './FormDiscoveryStep'
import { ScanProgressPanel } from './ScanProgressPanel'
import { createSignupTestEmail } from '@/lib/qa/browser/test-data'
import { CheckboxGroup } from '@/components/ui/checkbox-group'

const ADVANCED = [
  { value: 'pages', label: 'Pages et liens' }, { value: 'cta', label: 'Boutons et CTA' },
  { value: 'consoleErrors', label: 'Erreurs JavaScript' }, { value: 'mobileResponsive', label: 'Responsive mobile' },
]
export function FormAuditPage({ siteId, initialScanId, signature, previousScanId }: {
  siteId: string; initialScanId?: string; signature?: string; previousScanId?: string
}) {
  const router = useRouter()
  const [scanId, setScanId] = useState(initialScanId ?? null)
  const [selected, setSelected] = useState<string[]>([])
  const [consent, setConsent] = useState(false)
  const [advanced, setAdvanced] = useState<string[]>([])
  const initialized = useRef(false)
  const [emailTimestamp] = useState(() => Date.now())
  const start = useStartScan()
  const site = useQuery({ queryKey: ['site', siteId], queryFn: async () => {
    const response = await fetch(`/api/sites/${siteId}`)
    if (!response.ok) throw new Error('Site introuvable ou inaccessible.')
    return response.json() as Promise<{ name: string | null; url: string }>
  } })
  const discovery = useQuery({ queryKey: ['form-discovery', siteId], enabled: !!site.data && !scanId,
    retry: false, staleTime: Infinity, refetchOnWindowFocus: false,
    queryFn: async () => {
      const response = await fetch('/api/forms/discover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'La découverte a échoué.')
      return body as { forms: DiscoveredForm[]; pagesExplored: number; limited: boolean }
    },
  })
  useEffect(() => {
    if (!discovery.data || initialized.current) return
    initialized.current = true
    const available = discovery.data.forms.filter(form => form.testability.testable)
    let stored: unknown
    try { stored = JSON.parse(localStorage.getItem(`qualio:forms:${siteId}`) ?? 'null') } catch { stored = null }
    const defaults = available.filter(form => ['contact', 'newsletter', 'login'].includes(form.formType)).map(form => form.signature)
    setSelected(signature ? available.filter(form => form.signature === signature).map(form => form.signature)
      : Array.isArray(stored) ? available.filter(form => stored.includes(form.signature)).map(form => form.signature) : defaults)
  }, [discovery.data, signature, siteId])
  const selection = useMemo((): FormSelection[] => (discovery.data?.forms ?? []).filter(form => selected.includes(form.signature) && form.testability.testable).map((form, index) => ({
    signature: form.signature, pageUrl: form.occurrences[0].pageUrl, formType: form.formType,
    ...(form.formType === 'signup' ? { testEmail: createSignupTestEmail(emailTimestamp + index) } : {}),
  }) as FormSelection), [discovery.data, selected, emailTimestamp])
  const changeSelection = (signatures: string[]) => {
    setSelected(signatures); setConsent(false)
    try { localStorage.setItem(`qualio:forms:${siteId}`, JSON.stringify(signatures)) } catch { /* Storage may be unavailable. */ }
  }
  const launch = () => {
    if (!site.data || !selection.length || !consent) return
    start.mutate({ siteId, url: site.data.url, consentConfirmedAt: new Date().toISOString(),
      selectedModules: ['forms', ...advanced], selectedForms: selection, previousScanId },
    { onSuccess: data => { setScanId(data.scanId); router.replace(`/dashboard/sites/${siteId}/audit?scanId=${data.scanId}`) } })
  }
  return <div className="mx-auto max-w-3xl space-y-6 pb-16">
    <Link href={`/dashboard/sites/${siteId}`} className="text-xs font-semibold text-gray-500 hover:text-[#ee6018]">← Retour au site</Link>
    <header><p className="text-xs font-semibold text-[#ee6018]">Audit des formulaires</p><h1 className="mt-2 text-2xl font-bold tracking-tight">{site.data?.name || 'Choisissez ce que Qualio doit tester'}</h1>
      <p className="mt-2 break-all text-sm text-gray-500">{site.data?.url}</p></header>
    {site.isError && <p role="alert" className="text-sm text-red-600">{site.error.message}</p>}
    {scanId ? <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#16181E]"><ScanProgressPanel scanId={scanId} /></section> : <>
      {(site.isPending || discovery.isPending && !!site.data) && <div role="status" className="rounded-xl border border-gray-200 p-6 dark:border-white/10"><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-[#ee6018] motion-safe:animate-pulse" /><p className="text-sm font-semibold">Découverte passive des formulaires…</p></div><p className="mt-2 text-xs text-gray-500">Qualio explore jusqu’à 12 pages. Aucune soumission à cette étape.</p></div>}
      {discovery.isError && <div role="alert" className="rounded-xl border border-red-200 p-5"><p className="text-sm">{discovery.error.message}</p><button type="button" onClick={() => { initialized.current = false; void discovery.refetch() }} className="mt-3 rounded-lg bg-[#ee6018] px-4 py-2 text-xs font-semibold text-white">Réessayer la découverte</button></div>}
      {discovery.data && !discovery.data.forms.length && <section className="rounded-xl border border-dashed border-gray-200 p-6 dark:border-white/10"><h2 className="font-semibold">Aucun formulaire trouvé</h2><p className="mt-2 text-sm text-gray-500">Aucun formulaire identifiable sur les {discovery.data.pagesExplored} pages explorées. Vérifiez qu’un lien public mène à vos pages de contact ou de connexion. Les formulaires derrière une connexion ou certains composants SPA peuvent échapper à la détection.</p><button type="button" onClick={() => { initialized.current = false; void discovery.refetch() }} className="mt-4 text-xs font-semibold text-[#ee6018]">Relancer la découverte</button></section>}
      {!!discovery.data?.forms.length && <>
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-gray-500">{discovery.data.pagesExplored} pages explorées. {discovery.data.limited ? 'Plafond de découverte atteint ; d’autres formulaires peuvent exister.' : 'Découverte sans soumission.'}</p><button type="button" disabled={discovery.isFetching} onClick={() => { initialized.current = false; setConsent(false); void discovery.refetch() }} className="text-xs font-semibold text-[#ee6018] disabled:opacity-50">{discovery.isFetching ? 'Actualisation…' : 'Actualiser la découverte'}</button></div>
        {signature && !discovery.data.forms.some(form => form.signature === signature) && <p role="alert" className="rounded-lg border border-amber-200 p-3 text-xs text-amber-800 dark:text-amber-300">Le formulaire à retester n’a pas été retrouvé. Vérifiez les formulaires détectés avant de continuer.</p>}
        <FormDiscoveryStep forms={discovery.data.forms} selected={selected} onChange={changeSelection} />
        <details className="rounded-xl border border-gray-200 dark:border-white/10"><summary className="cursor-pointer p-4 text-xs font-semibold">Options avancées (facultatives)</summary><div className="px-3 pb-3"><CheckboxGroup options={ADVANCED} value={advanced} onChange={setAdvanced} /></div></details>
        <section className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          {selection.some(form => form.formType === 'signup') && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"><p className="font-semibold">Une inscription réelle sera tentée avec cet email :</p><ul className="mt-2 space-y-2">{selection.filter((form): form is Extract<FormSelection, { formType: 'signup' }> => form.formType === 'signup').map(form => <li key={form.signature}><p className="break-all font-mono">{form.testEmail}</p><p className="break-all">{form.pageUrl}</p></li>)}</ul><p className="mt-1">Un compte peut être créé sur votre site. Vous pourrez le supprimer après le test.</p></div>}
          <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#ee6018]" /><span>Je confirme avoir l’autorisation de tester ce site et d’envoyer réellement les formulaires sélectionnés avec des données de test. Les contacts et newsletters peuvent déclencher des emails. Les inscriptions peuvent créer des comptes avec l’email affiché ci-dessus. Sans identifiants de test, Qualio effectue une seule tentative de connexion invalide. Aucun CAPTCHA n’est contourné.</span></label>
        </section>
        {selection.length > 20 && <p role="alert" className="text-xs text-red-600">Sélectionnez au maximum 20 formulaires par audit.</p>}
        {start.isError && <p role="alert" className="text-xs text-red-600">{start.error.message}</p>}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white/95 py-4 backdrop-blur dark:border-white/10 dark:bg-[#111216]/95"><button type="button" onClick={launch} disabled={!selection.length || selection.length > 20 || !consent || start.isPending} className="w-full rounded-lg bg-[#ee6018] px-5 py-3 text-sm font-semibold text-white hover:bg-[#d95514] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ee6018]">{start.isPending ? 'Lancement…' : `Analyser la sélection (${selection.length})`}</button></div>
      </>}
    </>}
  </div>
}
