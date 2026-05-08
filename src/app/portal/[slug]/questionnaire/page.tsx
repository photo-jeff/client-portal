import { createClient } from '@/lib/supabase/server'
import { Divider } from '@/components/ui/Divider'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { QuestionnaireForm } from './QuestionnaireForm'

export default async function QuestionnairePage({
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

  const { data: existing } = await supabase
    .from('questionnaire_responses')
    .select('*')
    .eq('client_id', client.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/portal/${slug}`} className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a] mb-8 transition-colors">
        <ChevronLeft size={14} /> Back
      </Link>
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">Questionnaire</h1>
        <Divider />
        <p className="text-sm text-[#888] mt-4 max-w-md mx-auto">
          Your answers help us plan the perfect coverage for your wedding day. Please complete this at least 4 weeks before your wedding.
        </p>
      </div>
      <QuestionnaireForm
        clientId={client.id}
        slug={slug}
        partner1={client.partner1_name}
        partner2={client.partner2_name}
        initialData={existing?.data ?? null}
        isCompleted={!!existing?.completed_at}
      />
    </div>
  )
}
