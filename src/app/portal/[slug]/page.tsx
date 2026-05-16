import { createAdminClient } from '@/lib/supabase/admin'
import { SectionCard } from '@/components/portal/SectionCard'
import { Divider } from '@/components/ui/Divider'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CalendarHeart } from 'lucide-react'

export default async function PortalDashboard({
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

  const { data: questionnaire } = await admin
    .from('questionnaire_responses')
    .select('completed_at')
    .eq('client_id', client.id)
    .single()

  const { data: shotListItems } = await admin
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

  // Is this an album package? If so, show pre-wed shoot card
  const isAlbumPackage = client.package_name &&
    (client.package_name.toLowerCase().includes('album') ||
     client.package_name.toLowerCase().includes('frame'))

  // Timeline phase
  const isClose = daysUntil !== null && daysUntil <= 60
  const isApproaching = daysUntil !== null && daysUntil <= 180

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
        {daysUntil !== null && daysUntil <= 0 && (
          <p className="text-xs tracking-[0.1em] uppercase text-[#aaa] mt-1">
            What a day — thank you for having us
          </p>
        )}
      </div>

      {/* Pre-wedding shoot banner */}
      {isAlbumPackage && daysUntil !== null && daysUntil > 0 && (
        <div className="mb-6 bg-[#1a1a1a] text-white p-6 flex items-start gap-4">
          <CalendarHeart size={20} className="shrink-0 mt-0.5 text-[#aaa]" />
          <div>
            <p className="text-xs tracking-[0.12em] uppercase text-[#aaa] mb-1">Your {client.package_name} includes</p>
            <p className="font-serif text-lg mb-2">Pre-Wedding Shoot</p>
            <p className="text-sm text-[#aaa] mb-4">
              A relaxed shoot in the months before your wedding — a chance to get comfortable in front of the camera before the big day.
            </p>
            <a
              href="https://calendly.com/jeffoliverphoto/pre-wed-shoot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs tracking-[0.1em] uppercase border border-white/40 px-4 py-2 hover:bg-white hover:text-[#1a1a1a] transition-colors"
            >
              Book your shoot →
            </a>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="bg-white border border-[#e0ddd8] px-8">
        <SectionCard
          title="Wedding Details"
          description="Your venue, ceremony times, and key information."
          href={`/portal/${slug}/wedding-details`}
        />
        <SectionCard
          title="Questionnaire"
          description={
            isClose
              ? "Please complete this before your wedding day — we need your answers to plan everything."
              : "Help us understand your day. No rush — come back a few months before the wedding."
          }
          href={`/portal/${slug}/questionnaire`}
          completed={questionnaireComplete}
          required={isClose && !questionnaireComplete}
        />
        <SectionCard
          title="Shot List"
          description={
            isClose
              ? "Please submit your group shot requests — we need these at least 2 weeks before."
              : "Build your list of must-have group photos. Worth thinking about as you get closer."
          }
          href={`/portal/${slug}/shot-list`}
          completed={shotListComplete}
          required={isClose && !shotListComplete}
        />
        <SectionCard
          title="Invoices"
          description="Your deposit and balance information."
          href={`/portal/${slug}/invoices`}
        />
        <SectionCard
          title="For Your Venue"
          description="Photographer details, insurance documents, and what to expect on the day."
          href={`/portal/${slug}/venue-info`}
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
