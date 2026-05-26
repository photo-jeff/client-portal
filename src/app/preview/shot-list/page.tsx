import { Divider } from '@/components/ui/Divider'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ShotListWizard } from '@/app/portal/[slug]/shot-list/ShotListWizard'

export default function PreviewShotList() {
  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/preview" className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a] mb-8 transition-colors">
        <ChevronLeft size={14} /> Back
      </Link>
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">Shot List</h1>
        <Divider />
        <p className="text-sm text-[#888] mt-4 max-w-md mx-auto">
          We&apos;ll have a quick chat to build your personalised group shot list together.
        </p>
      </div>
      <ShotListWizard
        slug="preview"
        partner1="Paige"
        partner2="Jake"
        partner1Role="Bride"
        partner2Role="Groom"
        weddingDate={null}
        existingList={null}
      />
    </div>
  )
}
