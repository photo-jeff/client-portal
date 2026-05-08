import { SectionCard } from '@/components/portal/SectionCard'
import { Divider } from '@/components/ui/Divider'

export default function PreviewDashboard() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-xs tracking-[0.15em] uppercase text-[#888] mb-3">Welcome to your portal</p>
        <h1 className="font-serif text-5xl mb-3">Paige &amp; Jake</h1>
        <Divider />
        <p className="text-sm text-[#888] mt-4">Saturday, 21 March 2026</p>
        <p className="text-xs tracking-[0.1em] uppercase text-[#aaa] mt-1">306 days to go</p>
      </div>

      <div className="bg-white border border-[#e0ddd8] px-8">
        <SectionCard
          title="Wedding Details"
          description="Your venue, ceremony times, and key information."
          href="/preview/wedding-details"
        />
        <SectionCard
          title="Questionnaire"
          description="Help us understand your day so we can plan the perfect coverage."
          href="/preview/questionnaire"
          required
        />
        <SectionCard
          title="Shot List"
          description="Build your list of must-have group photos and special moments."
          href="/preview/shot-list"
          required
        />
        <SectionCard
          title="Invoices"
          description="View your invoices and make secure payments."
          href="/preview/invoices"
        />
        <SectionCard
          title="Important Information"
          description="Preparation tips, timings, and documents for your venue."
          href="/preview/important-info"
        />
      </div>

      <p className="text-center text-xs text-[#aaa] mt-10">
        Questions? Get in touch at{' '}
        <a href="mailto:hello@jeffoliverphotography.com" className="underline hover:text-[#1a1a1a]">
          hello@jeffoliverphotography.com
        </a>
      </p>
    </div>
  )
}
