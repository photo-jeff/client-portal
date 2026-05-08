import { createClient } from '@/lib/supabase/server'
import { SectionCard } from '@/components/portal/SectionCard'
import { Divider } from '@/components/ui/Divider'
import { redirect } from 'next/navigation'

export default async function PortalDashboard({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('portal_slug', slug)
    .single()

  if (!client) redirect('/login')

  const { data: questionnaire } = await supabase
    .from('questionnaire_responses')
    .select('completed_at')
    .eq('client_id', client.id)
    .single()

  const { data: shotListItems } = await supabase
    .from('shot_list_items')
    .select('id')
    .eq('client_id', client.id)

  const questionnaireComplete = !!questionnaire?.completed_at
  const shotListComplete = (shotListItems?.length ?? 0) > 0

  const weddingDate = client.wedding_date
    ? new Date(client.wedding_date).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      })
    : null

  const daysUntil = client.wedding_date
    ? Math.ceil((new Date(client.wedding_date).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="max-w-2xl mx-auto">
      {/* Welcome header */}
      <div className="text-center mb-12">
        <p className="text-xs tracking-[0.15em] uppercase text-[#888] mb-3">Welcome to your portal</p>
        <h1 className="font-serif text-5xl mb-3">
          {client.partner1_name} &amp; {client.partner2_name}
        </h1>
        <Divider />
        {weddingDate && (
          <p className="text-sm text-[#888] mt-4">{weddingDate}</p>
        )}
        {daysUntil !== null && daysUntil > 0 && (
          <p className="text-xs tracking-[0.1em] uppercase text-[#aaa] mt-1">
            {daysUntil} days to go
          </p>
        )}
      </div>

      {/* Sections */}
      <div className="bg-white border border-[#e0ddd8] px-8">
        <SectionCard
          title="Wedding Details"
          description="Your venue, ceremony times, and key information."
          href={`/portal/${slug}/wedding-details`}
        />
        <SectionCard
          title="Questionnaire"
          description="Help us understand your day so we can plan the perfect coverage."
          href={`/portal/${slug}/questionnaire`}
          completed={questionnaireComplete}
          required={!questionnaireComplete}
        />
        <SectionCard
          title="Shot List"
          description="Build your list of must-have group photos and special moments."
          href={`/portal/${slug}/shot-list`}
          completed={shotListComplete}
          required={!shotListComplete}
        />
        <SectionCard
          title="Invoices"
          description="View your invoices and make secure payments."
          href={`/portal/${slug}/invoices`}
        />
        <SectionCard
          title="Important Information"
          description="Preparation tips, timings, and documents for your venue."
          href={`/portal/${slug}/important-info`}
        />
      </div>

      <p className="text-center text-xs text-[#aaa] mt-10">
        Questions? Get in touch at{' '}
        <a href="mailto:hello@jeffoliverphotography.com" className="underline hover:text-[#1a1a1a]">
          hello@jeffoliverphotography.com
        </a>
      </p>
    </div>
  )
}
