import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-4 border-b border-[#f0ede8] last:border-0 flex flex-col sm:flex-row sm:gap-8">
      <dt className="text-xs tracking-[0.1em] uppercase text-[#888] sm:w-40 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-[#1a1a1a] mt-1 sm:mt-0">{value}</dd>
    </div>
  )
}

export default function PreviewWeddingDetails() {
  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/preview" className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a] mb-8 transition-colors">
        <ChevronLeft size={14} /> Back
      </Link>
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">Wedding Details</h1>
        <Divider />
      </div>
      <Card>
        <dl>
          <DetailRow label="Couple" value="Paige Willis & Jake Hughes" />
          <DetailRow label="Wedding date" value="Saturday, 21 March 2026" />
          <DetailRow label="Ceremony venue" value="The Orangery, Ashford Road, Turkey Mill Court, Maidstone ME14 5PP" />
          <DetailRow label="Ceremony time" value="1:30pm" />
          <DetailRow label="Reception venue" value="The Orangery, Maidstone" />
          <DetailRow label="Package" value="Gold Collection" />
          <DetailRow label="Lead photographer" value="Jeff Oliver" />
        </dl>
      </Card>
      <div className="mt-6 bg-[#faf9f7] border border-[#e0ddd8] p-6">
        <p className="text-xs tracking-[0.1em] uppercase text-[#888] mb-2">Need to update something?</p>
        <p className="text-sm text-[#888]">
          If any details are incorrect, please get in touch at{' '}
          <a href="mailto:hello@jeffoliverphotography.com" className="underline hover:text-[#1a1a1a]">
            hello@jeffoliverphotography.com
          </a>
        </p>
      </div>
    </div>
  )
}
