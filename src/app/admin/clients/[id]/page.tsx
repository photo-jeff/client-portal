import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Divider } from '@/components/ui/Divider'
import { Button } from '@/components/ui/Button'
import { ClientIdFields } from './ClientIdFields'
import { DeleteClientButton } from './DeleteClientButton'
import { InviteButton } from './InviteButton'
import { PrewedOverride } from './PrewedOverride'
import { MeetingOverrides } from './MeetingOverrides'
import { ShotListComplete } from './ShotListComplete'
import { ResyncQuestionnaire } from './ResyncQuestionnaire'

export default async function ClientDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') redirect('/login')

  const admin = createAdminClient()
  const { data: client } = await admin.from('clients').select('*').eq('id', id).single()
  if (!client) notFound()

  // Prev/next in same order as admin list (wedding_date asc, past > 10 weeks excluded)
  const archiveThreshold = new Date(Date.now() - 70 * 86_400_000).toISOString().split('T')[0]
  const { data: allClients } = await admin
    .from('clients')
    .select('id')
    .or(`wedding_date.is.null,wedding_date.gte.${archiveThreshold}`)
    .order('wedding_date', { ascending: true, nullsFirst: false })
  const ids = (allClients ?? []).map((c: { id: string }) => c.id)
  const idx = ids.indexOf(id)
  const prevId = idx > 0 ? ids[idx - 1] : null
  const nextId = idx < ids.length - 1 ? ids[idx + 1] : null

  const { data: questionnaire } = await admin
    .from('questionnaire_responses')
    .select('data, completed_at, updated_at')
    .eq('client_id', id)
    .single()

  const { data: shotList } = await admin
    .from('shot_list_items')
    .select('*')
    .eq('client_id', id)
    .order('sort_order')

  const { data: shotListChat } = await admin
    .from('shot_list_chats')
    .select('messages, completed_at')
    .eq('client_id', id)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const shotListText = (client as Record<string, unknown>).shot_list_text as string | null
  const shotListManuallyComplete = (client as Record<string, unknown>).shot_list_completed as boolean ?? false
  const hasSubmittedList = !!shotListText || (shotList?.length ?? 0) > 0
  const prewedOverride       = (client as Record<string, unknown>).prewedding_override      as string | null ?? null
  const prewedShootAt        = (client as Record<string, unknown>).prewedding_shoot_at       as string | null ?? null
  const finalMeetingEnabled  = (client as Record<string, unknown>).final_meeting_enabled     as boolean ?? false
  const phoneCallEnabled     = (client as Record<string, unknown>).phone_call_enabled        as boolean ?? false
  const isAlbumPackage = !!(client.package_name && (
    client.package_name.toLowerCase().includes('album') ||
    client.package_name.toLowerCase().includes('frame')
  ))
  const weddingDate  = client.wedding_date ? new Date(client.wedding_date) : null
  const daysUntil    = weddingDate ? Math.ceil((weddingDate.getTime() - Date.now()) / 86400000) : null
  const shootInPast  = prewedShootAt ? new Date(prewedShootAt) < new Date() : false
  const isAutoEligible = daysUntil !== null && daysUntil > 0 && !shootInPast && (isAlbumPackage || !!prewedShootAt)

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      <header className="bg-white border-b border-[#e0ddd8]">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a] flex items-center gap-1">
              ‹ Back
            </Link>
            <h1 className="font-serif text-xl">
              {client.partner1_name} & {client.partner2_name}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {prevId ? (
              <Link href={`/admin/clients/${prevId}`} className="px-3 py-1.5 text-sm text-[#888] hover:text-[#1a1a1a] hover:bg-[#f5f3f0] rounded-lg transition-colors" title="Previous client">
                ‹ Prev
              </Link>
            ) : (
              <span className="px-3 py-1.5 text-sm text-[#ccc] cursor-default">‹ Prev</span>
            )}
            {idx >= 0 && (
              <span className="text-xs text-[#ccc] px-1">{idx + 1} / {ids.length}</span>
            )}
            {nextId ? (
              <Link href={`/admin/clients/${nextId}`} className="px-3 py-1.5 text-sm text-[#888] hover:text-[#1a1a1a] hover:bg-[#f5f3f0] rounded-lg transition-colors" title="Next client">
                Next ›
              </Link>
            ) : (
              <span className="px-3 py-1.5 text-sm text-[#ccc] cursor-default">Next ›</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        {/* Client Details — all editable inline */}
        <section className="bg-white border border-[#e0ddd8] p-8 rounded-2xl">
          <h2 className="font-serif text-xl mb-2">Client Details</h2>
          <p className="text-xs text-[#aaa] mb-6">Click any field to edit, then press Enter or click away to save.</p>
          <Divider />
          <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <ClientIdFields
              clientId={client.id}
              initialValues={{
                partner1_name: client.partner1_name ?? null,
                partner2_name: client.partner2_name ?? null,
                partner1_role: (client as Record<string, unknown>).partner1_role as string ?? 'Bride',
                partner2_role: (client as Record<string, unknown>).partner2_role as string ?? 'Groom',
                email: client.email ?? null,
                wedding_date: client.wedding_date ?? null,
                ceremony_time: client.ceremony_time ?? null,
                ceremony_venue: client.ceremony_venue ?? null,
                reception_venue: client.reception_venue ?? null,
                package_name: client.package_name ?? null,
                vsco_job_id: client.vsco_job_id ?? null,
                zoho_contact_id: (client as Record<string, unknown>).zoho_contact_id as string | null,
                vsco_questionnaire_url: (client as Record<string, unknown>).vsco_questionnaire_url as string | null,
                vsco_shot_list_url: (client as Record<string, unknown>).vsco_shot_list_url as string | null,
              }}
            />
          </dl>
          <div className="mt-6 pt-4 border-t border-[#f0ede8] text-sm">
            <span className="text-xs tracking-[0.1em] uppercase text-[#888]">Portal slug</span>
            <div className="mt-1">
              <Link href={`/portal/${client.portal_slug}`} className="underline hover:no-underline text-sm" target="_blank">
                {client.portal_slug}
              </Link>
            </div>
          </div>
          {client.invite_sent_at && (
            <div className="mt-4 text-sm">
              <span className="text-xs tracking-[0.1em] uppercase text-[#888]">Invite sent</span>
              <div className="mt-1">
                {new Date(client.invite_sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )}
        </section>

        {/* Questionnaire */}
        <section className="bg-white border border-[#e0ddd8] p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl">Questionnaire</h2>
            {questionnaire?.completed_at
              ? <span className="text-xs tracking-[0.1em] uppercase text-green-600">Completed</span>
              : questionnaire
              ? <span className="text-xs tracking-[0.1em] uppercase text-amber-500">In progress</span>
              : <span className="text-xs tracking-[0.1em] uppercase text-[#bbb]">Not started</span>}
          </div>
          <Divider />
          {questionnaire?.data ? (
            <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {Object.entries(questionnaire.data as Record<string, string>).map(([key, value]) =>
                value ? (
                  <div key={key}>
                    <dt className="text-xs tracking-[0.1em] uppercase text-[#888] mb-1">{key.replace(/_/g, ' ')}</dt>
                    <dd>{value}</dd>
                  </div>
                ) : null
              )}
            </dl>
          ) : (
            <p className="mt-6 text-sm text-[#888]">Client hasn&apos;t filled this in yet.</p>
          )}

          <div className="mt-6 pt-6 border-t border-[#f0ede8]">
            <p className="text-xs text-[#aaa] mb-3">
              Re-push these answers to the client&apos;s VSCO questionnaire form — use after a change so VSCO stays in sync.
            </p>
            <ResyncQuestionnaire
              clientId={client.id}
              hasUrl={!!(client as Record<string, unknown>).vsco_questionnaire_url}
              hasAnswers={!!questionnaire?.data && Object.keys(questionnaire.data as Record<string, unknown>).length > 0}
            />
          </div>
        </section>

        {/* Shot List */}
        <section className="bg-white border border-[#e0ddd8] p-8 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl">Shot List</h2>
            {(hasSubmittedList || shotListManuallyComplete) && (
              <span className="text-xs tracking-[0.1em] uppercase text-green-600">
                Completed{!hasSubmittedList && shotListManuallyComplete ? ' (marked manually)' : ''}
              </span>
            )}
          </div>
          <Divider />
          {shotListText ? (
            <pre className="mt-6 text-sm text-[#1a1a1a] whitespace-pre-wrap leading-relaxed font-sans">
              {shotListText}
            </pre>
          ) : (
            <p className="mt-6 text-sm text-[#888]">Client hasn&apos;t completed their shot list in the portal.</p>
          )}

          <div className="mt-6 pt-6 border-t border-[#f0ede8]">
            <p className="text-xs text-[#aaa] mb-3">
              If a couple sends their shot list outside the portal, mark it complete here so the portal checklist reflects it.
            </p>
            <ShotListComplete
              clientId={client.id}
              completed={shotListManuallyComplete}
              hasList={hasSubmittedList}
            />
          </div>

          {shotListChat && Array.isArray(shotListChat.messages) && shotListChat.messages.length > 0 && (
            <details className="mt-8">
              <summary className="cursor-pointer text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a] select-none">
                View chat transcript
              </summary>
              <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto">
                {(shotListChat.messages as { role: string; content: string; hidden?: boolean }[])
                  .filter(m => !m.hidden)
                  .map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-[#f5f3f0] text-[#1a1a1a] rounded-br-sm'
                            : 'bg-[#1a1a1a] text-[#e8e8e8] rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
              </div>
            </details>
          )}
        </section>

        {/* Pre-Wedding Shoot */}
        <section className="bg-white border border-[#e0ddd8] p-8 rounded-2xl">
          <h2 className="font-serif text-xl mb-2">Pre-Wedding Shoot</h2>
          <p className="text-xs text-[#aaa] mb-6">Override visibility or clear a booking so the client can rebook.</p>
          <Divider />
          <div className="mt-6">
            <PrewedOverride
              clientId={client.id}
              override={prewedOverride}
              shootAt={prewedShootAt}
              isAutoEligible={isAutoEligible}
            />
          </div>
        </section>

        {/* Pre-Wedding Meeting Booking */}
        <section className="bg-white border border-[#e0ddd8] p-8 rounded-2xl">
          <h2 className="font-serif text-xl mb-2">Meeting Booking</h2>
          <p className="text-xs text-[#aaa] mb-6">Show a Calendly booking card on the portal dashboard for a final meeting or a phone call.</p>
          <Divider />
          <div className="mt-6">
            <MeetingOverrides
              clientId={client.id}
              finalMeetingEnabled={finalMeetingEnabled}
              phoneCallEnabled={phoneCallEnabled}
            />
          </div>
        </section>

        {/* Actions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Link href={`/portal/${client.portal_slug}`} target="_blank">
              <Button variant="outline">View portal →</Button>
            </Link>
            <DeleteClientButton
              clientId={client.id}
              clientName={`${client.partner1_name} & ${client.partner2_name}`}
            />
          </div>
          <div className="bg-white border border-[#e0ddd8] p-6 rounded-2xl">
            <h3 className="text-xs tracking-[0.1em] uppercase text-[#888] mb-3">Send portal invite</h3>
            <InviteButton
              clientId={client.id}
              email={client.email ?? null}
              inviteSentAt={client.invite_sent_at ?? null}
            />
          </div>
        </section>

      </main>
    </div>
  )
}
