import type { Metadata } from 'next'
import { getAdminContext } from '@/lib/admin/auth'
import { Notice, PageHeader, Panel } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Brouillons acquisition' }

export default async function DraftsPage() { await getAdminContext(); return <div className="mx-auto max-w-5xl space-y-6"><PageHeader eyebrow="Acquisition / Brouillons" title="Brouillons de messages" description="Relis et approuve chaque message avant tout envoi." /><Notice tone="info">Les brouillons sont préparés dans Admin uniquement. Aucun message n’est envoyé automatiquement.</Notice><Panel id="drafts" title="Messages à relire" description="Cette vue recevra les brouillons générés depuis Prospects."><p className="text-sm text-stone-400">Génère un brouillon depuis un contact dans Prospects pour le retrouver ici.</p></Panel></div> }
