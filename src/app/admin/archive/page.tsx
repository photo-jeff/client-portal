import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Divider } from '@/components/ui/Divider'
import { ArchiveList } from './ArchiveList'

export default async function ArchivePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== 'mrjeffoliver@gmail.com') redirect('/login')

  // Portals archived = wedding date > 10 weeks ago
  const archiveThreshold = new Date(Date.now() - 70 * 86_400_000).toISOString().split('T')[0]

  const admin = createAdminClient()
  const { data: clients } = await admin
    .from('clients')
    .select('*')
    .lt('wedding_date', archiveThreshold)
    .order('wedding_date', { ascending: false })

  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      <header className="bg-white border-b border-[#e0ddd8]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a] flex items-center gap-1">
              ‹ Active portals
            </Link>
            <h1 className="font-serif text-xl">Archive</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl mb-2">Archived Portals</h2>
          <Divider />
          <p className="text-sm text-[#919295] mt-4">
            Portals move here automatically 10 weeks after the wedding date.
            Select and delete in bulk once you&apos;ve confirmed galleries are delivered.
          </p>
        </div>

        <ArchiveList clients={clients ?? []} />
      </main>
    </div>
  )
}
