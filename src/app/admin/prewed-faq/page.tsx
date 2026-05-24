import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Divider } from '@/components/ui/Divider'
import { PrewedFaqEditor } from './PrewedFaqEditor'

export default async function AdminPrewedFaqPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') redirect('/login')

  const admin = createAdminClient()
  const { data: items } = await admin
    .from('prewed_faq')
    .select('*')
    .order('sort_order')

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      <header className="bg-white border-b border-[#e0ddd8]">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center gap-4">
          <Link href="/admin" className="text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a]">
            ‹ Back
          </Link>
          <h1 className="font-serif text-xl">Pre-Wedding Shoot FAQ</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl mb-2">FAQ Questions</h2>
          <Divider />
          <p className="text-sm text-[#919295] mt-4">
            Click any field to edit. Changes save automatically when you click away.
          </p>
        </div>

        <PrewedFaqEditor items={items ?? []} />
      </main>
    </div>
  )
}
