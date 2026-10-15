'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Select } from './Select'
import { primaryButton, secondaryButton } from './ui'

const guides: Record<string, string> = {
  html: '1. Ouvrez le code global du site. 2. Collez le script juste avant </body>. 3. Enregistrez et publiez. Le script doit être ajouté une seule fois.',
  wordpress: '1. Ouvrez l’outil de scripts du thème ou une extension dédiée. 2. Ajoutez le script dans le pied de page global. 3. Enregistrez, videz le cache et publiez. Un bloc HTML peut filtrer les scripts.',
  webflow: '1. Ouvrez Project settings → Custom Code. 2. Collez le script dans Footer Code. 3. Enregistrez et publiez le site. Custom Code nécessite une offre compatible.',
  shopify: '1. Ouvrez Boutique en ligne → Thèmes → Modifier le code. 2. Ouvrez layout/theme.liquid. 3. Collez le script avant </body>, enregistrez et vérifiez le thème publié. Cela ne concerne pas le checkout.',
}

export function WidgetGuide({ script, accentColor, buttonLabel, position, projectName, onMessage }: { script: string; accentColor: string; buttonLabel: string; position: string; projectName: string; onMessage: (message: string) => void }) {
  const [platform, setPlatform] = useState('html')
  const [mobile, setMobile] = useState(false)
  const [open, setOpen] = useState(true)
  async function copyInstructions() {
    try { await navigator.clipboard.writeText(`Installer le widget Qualio pour le projet ${projectName}.\n${guides[platform]}\n\n${script}\n\nVérifiez le bouton sur ordinateur et mobile, puis envoyez un avis de test depuis la page publiée.`); onMessage('Instructions copiées pour votre développeur.') }
    catch { onMessage('Copie impossible. Copiez le script et les instructions affichées.') }
  }
  return <div className="space-y-6">
    <section aria-label="Aperçu du widget" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold text-gray-950 dark:text-white">Aperçu · {projectName}</h3><div role="group" aria-label="Format de l’aperçu" className="flex gap-2"><button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)} className={secondaryButton}>Ordinateur</button><button type="button" aria-pressed={mobile} onClick={() => setMobile(true)} className={secondaryButton}>Mobile</button></div></div>
      <div className={`relative mx-auto flex min-h-96 flex-col justify-end gap-3 rounded-xl border border-gray-200 bg-gray-100 p-4 dark:border-white/10 dark:bg-black/20 ${mobile ? 'max-w-[360px]' : 'w-full'}`}>
        <p className="absolute left-4 top-4 text-xs text-gray-500 dark:text-zinc-400">Aperçu sans envoi d’avis</p>
        {open && <div className={`w-full max-w-[360px] rounded-2xl border border-gray-200 bg-white p-[18px] text-gray-950 ${position === 'left' ? 'self-start' : 'self-end'}`}><div className="flex justify-between gap-3"><h4 className="text-[17px] font-semibold">Votre avis compte</h4><button type="button" aria-label="Fermer l’aperçu du formulaire" onClick={() => setOpen(false)} className="px-2">×</button></div><p className="mt-2 text-[13px] text-gray-600">Dites-nous ce qui fonctionne ou ce qui pourrait être amélioré.</p><p className="mt-4 text-xs font-semibold">Votre avis</p><div className="mt-2 h-20 rounded-lg border border-gray-300 p-3 text-sm text-gray-500">Écrivez votre avis…</div><p className="mt-3 text-xs text-gray-600">Nom et email facultatifs</p><span className="mt-4 inline-block rounded-lg bg-gray-950 px-4 py-2 text-sm text-white">Envoyer</span></div>}
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} style={{ backgroundColor: accentColor }} className={`max-w-full break-words rounded-full px-5 py-3 text-sm font-semibold text-white ${position === 'left' ? 'self-start' : 'self-end'}`}>{buttonLabel || 'Laisser un avis'}</button>
      </div>
      <p className="text-xs text-gray-500 dark:text-zinc-400">Le formulaire réel propose un avis, un nom et un email facultatifs. Les changements d’apparence doivent être enregistrés, puis le script installé doit être mis à jour.</p>
    </section>
    <section className="space-y-3 border-t border-gray-200 pt-5 dark:border-white/10"><h3 className="font-semibold text-gray-950 dark:text-white">Installer sur votre site</h3><Select label="Plateforme d’installation" value={platform} onChange={setPlatform} options={[{ value: 'html', label: 'HTML / application web' }, { value: 'wordpress', label: 'WordPress' }, { value: 'webflow', label: 'Webflow' }, { value: 'shopify', label: 'Shopify' }]} /><p className="text-sm leading-6 text-gray-600 dark:text-zinc-300">{guides[platform]}</p><button type="button" onClick={() => void copyInstructions()} className={secondaryButton}>Copier les instructions pour mon développeur</button><ol className="list-decimal space-y-2 pl-5 text-sm text-gray-600 dark:text-zinc-300"><li>Copiez le script de ce projet et publiez votre site.</li><li>Ouvrez la page publique et envoyez un avis de test.</li><li>Revenez ici pour vérifier sa réception.</li></ol><Link href="/dashboard/feedback" className={primaryButton}>Voir les avis reçus</Link></section>
  </div>
}
