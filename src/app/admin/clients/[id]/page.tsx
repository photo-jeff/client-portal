import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Divider } from '@/components/ui/Divider'
import { Button } from '@/components/ui/Button'
import { ClientIdFields } from './ClientIdFields'

export default async function ClientDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') redirect('/login')

  const admin = createAdminClient()
  const { data: client } = await admin.from('clients').select('*').eq('id', id).single()
  if (!client) notFound()

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

  const shotListText = (client as Record<string, unknown>).shot_list_text as string | null

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      <header className="bg-white border-b border-[#e0ddd8]">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center gap-4">
          <Link href="/admin" className="text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a] flex items-center gap-1">
            ‹ Back
          </Link>
          <h1 className="font-serif text-xl">
            {client.partner1_name} & {client.partner2_name}
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        {/* Client Details */}
        <section className="bg-white border border-[#e0ddd8] p-8">
          <h2 className="font-serif text-xl mb-6">Client Details</h2>
          <Divider />
          <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <dt className="text-xs tracking-[0.1em] uppercase text-[#888] mb-1">Email</dt>
              <dd>{client.email}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-[0.1em] uppercase text-[#888] mb-1">Portal slug</dt>
              <dd>
                <Link href={`/portal/${client.portal_slug}`} className="underline hover:no-underline" target="_blank">
                  {client.portal_slug}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs tracking-[0.1em] uppercase text-[#888] mb-1">Wedding date</dt>
              <dd>{client.wedding_date ? new Date(client.wedding_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-[0.1em] uppercase text-[#888] mb-1">Ceremony time</dt>
              <dd>{client.ceremony_time || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-[0.1em] uppercase text-[#888] mb-1">Ceremony venue</dt>
              <dd>{client.ceremony_venue || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-[0.1em] uppercase text-[#888] mb-1">Reception venue</dt>
              <dd>{client.reception_venue || client.ceremony_venue || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-[0.1em] uppercase text-[#888] mb-1">Package</dt>
              <dd>{client.package_name || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-[0.1em] uppercase text-[#888] mb-1">Invite sent</dt>
              <dd>{client.invite_sent_at ? new Date(client.invite_sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not yet'}</dd>
            </div>
            <ClientIdFields
              clientId={client.id}
              vscoJobId={client.vsco_job_id ?? null}
              zohoContactId={(client as Record<string, unknown>).zoho_contact_id as string | null}
            />
          </dl>
        </section>

        {/* Questionnaire */}
        <section className="bg-white border border-[#e0ddd8] p-8">
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
        </section>

        {/* Shot List */}
        <section className="bg-white border border-[#e0ddd8] p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl">Shot List</h2>
            {shotListText && (
              <span className="text-xs tracking-[0.1em] uppercase text-green-600">Completed</span>
            )}
          </div>
          <Divider />
          {shotListText ? (
            <pre className="mt-6 text-sm text-[#1a1a1a] whitespace-pre-wrap leading-relaxed font-sans">
              {shotListText}
            </pre>
          ) : (
            <p className="mt-6 text-sm text-[#888]">Client hasn&apos;t completed their shot list yet.</p>
          )}
        </section>

        {/* Actions */}
        <section className="flex gap-4">
          <Link href={`/portal/${client.portal_slug}`} target="_blank">
            <Button variant="outline">View portal →</Button>
          </Link>
        </section>

      </main>
    </div>
  )
}
