import { notFound } from 'next/navigation'
import { FeedbackSectionPage } from '@/components/dashboard/FeedbackSectionPage'

const sections = ['projects', 'feedback', 'analysis', 'recommendations', 'reports', 'collection'] as const

export default async function DashboardSectionRoute({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!sections.includes(section as (typeof sections)[number])) notFound()
  return <FeedbackSectionPage section={section as (typeof sections)[number]} />
}
