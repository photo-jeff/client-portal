export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { SectionCard } from '@/components/portal/SectionCard'
import { Divider } from '@/components/ui/Divider'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PrewedShootCard } from './PrewedShootCard'
import { InvoiceCard } from './InvoiceCard'
import { MeetingCard } from './MeetingCard'

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
  // Completion can come from either the legacy structured items or the
  // conversational wizard, which saves the finished list to shot_list_text.
  // It can also be set manually by Jeff (e.g. when a couple sends a list
  // outside the portal) via the admin shot_list_completed flag.
  const shotListText = (client as Record<string, unknown>).shot_list_text as string | null
  const shotListManuallyComplete = (client as Record<string, unknown>).shot_list_completed as boolean ?? false
  const shotListComplete =
    shotListManuallyComplete ||
    (shotListItems?.length ?? 0) > 0 ||
    (typeof shotListText === 'string' && shotListText.trim().length > 0)

  const weddingDate = client.wedding_date
    ? new Date(client.wedding_date).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      })
    : null

  const daysUntil = client.wedding_date
    ? Math.ceil((new Date(client.wedding_date).getTime() - Date.now()) / 86400000)
    : null

  // Pre-wedding shoot visibility
  const isAlbumPackage = !!(client.package_name && (
    client.package_name.toLowerCase().includes('album') ||
    client.package_name.toLowerCase().includes('frame')
  ))
  const shootAt             = (client as Record<string, unknown>).prewedding_shoot_at       as string | null ?? null
  const rescheduleUrl       = (client as Record<string, unknown>).prewedding_reschedule_url  as string | null ?? null
  const prewedOverride      = (client as Record<string, unknown>).prewedding_override        as string | null ?? null
  const finalMeetingEnabled = (client as Record<string, unknown>).final_meeting_enabled      as boolean ?? false
  const phoneCallEnabled    = (client as Record<string, unknown>).phone_call_enabled         as boolean ?? false

  const shootInPast    = shootAt ? new Date(shootAt) < new Date() : false
  const datesOk        = daysUntil !== null && daysUntil > 0 && !shootInPast

  const showPrewedCard =
    prewedOverride === 'off' ? false :
    prewedOverride === 'on'  ? datesOk :
    datesOk && (isAlbumPackage || !!shootAt)

  // Timeline phase
  const isUrgent = daysUntil !== null && daysUntil > 0 && daysUntil <= 30
  const isClose = daysUntil !== null && daysUntil <= 60
  const isApproaching = daysUntil !== null && daysUntil <= 180

  return (
    <div className="max-w-2xl mx-auto">
      {/* Welcome header */}
      <div className="text-center mb-12">
        <p className="font-display text-[0.6rem] tracking-[0.2em] uppercase text-[#919295] mb-3">Welcome to your portal</p>
        <h1 className="font-serif text-3xl mb-3">
          {client.partner1_name} &amp; {client.partner2_name}
        </h1>
        <Divider />
        {weddingDate && (
          <p className="text-sm text-[#919295] mt-4">{weddingDate}</p>
        )}
        {daysUntil !== null && daysUntil > 0 && (
          <p className="text-xs tracking-[0.1em] uppercase text-[#b5b8ba] mt-1">
            {daysUntil} days to go
          </p>
        )}
        {daysUntil !== null && daysUntil <= 0 && (
          <p className="text-xs tracking-[0.1em] uppercase text-[#b5b8ba] mt-1">
            What a day — thank you for having us
          </p>
        )}
      </div>

      {/* Pre-wedding shoot */}
      {showPrewedCard && (
        <PrewedShootCard
          shootAt={shootAt}
          rescheduleUrl={rescheduleUrl}
          slug={slug}
        />
      )}

      {/* Final meeting or phone call booking */}
      {finalMeetingEnabled && (
        <MeetingCard type="final_meeting" slug={slug} />
      )}
      {phoneCallEnabled && (
        <MeetingCard type="phone_call" slug={slug} />
      )}

      {/* Sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SectionCard
          title="Wedding Details"
          description="Your venue, ceremony times, and key information."
          href={`/portal/${slug}/wedding-details`}
        />
        <SectionCard
          title="Questionnaire"
          description={
            isUrgent
              ? "Please complete this as soon as possible — we need your answers at least 3 weeks before your wedding."
              : "Help us understand your day. Please aim to complete this at least 3 weeks before your wedding."
          }
          href={`/portal/${slug}/questionnaire`}
          completed={questionnaireComplete}
          required={isUrgent && !questionnaireComplete}
          urgent={isUrgent && !questionnaireComplete}
        />
        <SectionCard
          title="Shot List"
          description={
            isUrgent
              ? "Please submit your group shot requests as soon as possible — we need these at least 3 weeks before."
              : "Build your list of must-have group photos. Please aim to complete this at least 3 weeks before your wedding."
          }
          href={`/portal/${slug}/shot-list`}
          completed={shotListComplete}
          required={isUrgent && !shotListComplete}
          urgent={isUrgent && !shotListComplete}
        />
        <InvoiceCard
          slug={slug}
          daysUntil={daysUntil}
          href={`/portal/${slug}/invoices`}
        />
        <SectionCard
          title="For Your Venue"
          description="Photographer details, insurance documents and general information for your venue."
          href={`/portal/${slug}/venue-info`}
        />
        <SectionCard
          title="FAQ"
          description="Important information about your day."
          href={`/portal/${slug}/faq`}
        />
      </div>

      {/* Photo triptych */}
      <div className="grid grid-cols-3 gap-2 mt-10">
        {([
          { src: '/M_and_D-008.jpg', position: '50% 30%' },
          { src: '/B_and_L-019.jpg', position: '50% 40%' },
          { src: '/R_and_J-19.jpg', position: '35% 50%' },
        ] as { src: string; position: string }[]).map(({ src, position }) => (
          <div key={src} className="relative overflow-hidden rounded-2xl" style={{ paddingBottom: '133%' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: position }}
            />
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-[#b5b8ba] mt-10">
        Questions? Get in touch at{' '}
        <a href="mailto:hello@jeffoliverphotography.com" className="underline hover:text-[#535353]">
          hello@jeffoliverphotography.com
        </a>
      </p>
    </div>
  )
}
