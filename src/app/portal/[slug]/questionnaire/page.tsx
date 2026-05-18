import { createAdminClient } from '@/lib/supabase/admin'
import { Divider } from '@/components/ui/Divider'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { QuestionnaireForm } from './QuestionnaireForm'

export default async function QuestionnairePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('*')
    .eq('portal_slug', slug)
    .single()

  if (!client) notFound()

  const { data: existing } = await admin
    .from('questionnaire_responses')
    .select('*')
    .eq('client_id', client.id)
    .single()

  const daysUntil = client.wedding_date
    ? Math.ceil((new Date(client.wedding_date).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/portal/${slug}`} className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#919295] hover:text-[#535353] mb-8 transition-colors">
        <ChevronLeft size={14} /> Back
      </Link>
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">Questionnaire</h1>
        <Divider />
        <p className="text-sm text-[#919295] mt-4 max-w-md mx-auto">
          Your answers help us plan the perfect coverage. The more we know, the better prepared we are for your day.
        </p>
      </div>
      <QuestionnaireForm
        clientId={client.id}
        slug={slug}
        partner1={client.partner1_name}
        partner2={client.partner2_name}
        ceremonyVenue={client.ceremony_venue ?? null}
        ceremonyTime={client.ceremony_time ?? null}
        receptionVenue={client.reception_venue ?? null}
        daysUntil={daysUntil}
        initialData={existing?.data ?? null}
        isCompleted={!!existing?.completed_at}
      />
    </div>
  )
}
