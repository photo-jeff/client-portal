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
                email: client.email ?? null,
                wedding_date: client.wedding_date ?? null,
                ceremony_time: client.ceremony_time ?? null,
                ceremony_venue: client.ceremony_venue ?? null,
                reception_venue: client.reception_venue ?? null,
                package_name: client.package_name ?? null,
                vsco_job_id: client.vsco_job_id ?? null,
                zoho_contact_id: (client as Record<string, unknown>).zoho_contact_id as string | null,
                vsco_questionnaire_url: (client as Record<string, unknown>).vsco_questionnaire_url as string | null,
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
        </section>

        {/* Shot List */}
        <section className="bg-white border border-[#e0ddd8] p-8 rounded-2xl">
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
