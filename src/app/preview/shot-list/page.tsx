import { Divider } from '@/components/ui/Divider'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ShotListWizard } from '@/app/portal/[slug]/shot-list/ShotListWizard'

const MOCK_ITEMS = [
  { id: '1', client_id: 'preview', description: 'Paige & Jake with both sets of parents', category: 'Immediate family', people: 'Both sets of parents', sort_order: 0 },
  { id: '2', client_id: 'preview', description: "Paige & Jake with Paige's parents", category: 'Immediate family', people: "Paige's parents", sort_order: 1 },
  { id: '3', client_id: 'preview', description: "Paige & Jake with Jake's parents", category: 'Immediate family', people: "Jake's parents", sort_order: 2 },
  { id: '4', client_id: 'preview', description: 'Paige & Jake with full bridal party', category: 'Bridesmaids & groomsmen', people: 'Full bridal party', sort_order: 3 },
  { id: '5', client_id: 'preview', description: 'Paige with bridesmaids', category: 'Bride with bridesmaids', people: 'Bridesmaids', sort_order: 4 },
  { id: '6', client_id: 'preview', description: 'Jake with groomsmen', category: 'Groom with groomsmen', people: 'Groomsmen', sort_order: 5 },
]

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
          Build your list of must-have group photos. We recommend no more than 15 combinations.
        </p>
      </div>
      <ShotListWizard
        clientId="preview"
        partner1="Paige"
        partner2="Jake"
        initialItems={MOCK_ITEMS}
      />
    </div>
  )
}
