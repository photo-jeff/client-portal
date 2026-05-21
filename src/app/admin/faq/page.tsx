import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Divider } from '@/components/ui/Divider'
import { FaqEditor } from './FaqEditor'

export default async function AdminFaqPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') redirect('/login')

  const admin = createAdminClient()
  const { data: blocks } = await admin
    .from('faq_blocks')
    .select('*')
    .order('sort_order')

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      <header className="bg-white border-b border-[#e0ddd8]">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center gap-4">
          <Link href="/admin" className="text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a]">
            ‹ Back
          </Link>
          <h1 className="font-serif text-xl">FAQ Editor</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl mb-2">FAQ Blocks</h2>
          <Divider />
          <p className="text-sm text-[#919295] mt-4">
            Click into any block to edit. Changes save automatically when you click away.
          </p>
          <p className="text-xs text-[#bbb] mt-2">
            Use <code className="bg-[#f0ede8] px-1 py-0.5 rounded text-[#888]">{'{{delivery_date}}'}</code> to insert each client&apos;s gallery delivery date (8 weeks after their wedding).
          </p>
        </div>

        <FaqEditor blocks={blocks ?? []} />
      </main>
    </div>
  )
}
