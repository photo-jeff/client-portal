import { Divider } from '@/components/ui/Divider'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { NewClientForm } from './NewClientForm'

export default function NewClientPage() {
  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      <header className="bg-white border-b border-[#e0ddd8]">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <h1 className="font-serif text-xl">Jeff Oliver Photography — Admin</h1>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-6 py-12">
        <Link href="/admin" className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a] mb-8 transition-colors">
          <ChevronLeft size={14} /> Back to portals
        </Link>
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl mb-2">Create New Portal</h2>
          <Divider />
        </div>
        <NewClientForm />
      </main>
    </div>
  )
}
