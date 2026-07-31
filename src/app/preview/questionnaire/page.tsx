import { Divider } from '@/components/ui/Divider'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { QuestionnaireForm } from '@/app/portal/[slug]/questionnaire/QuestionnaireForm'

const MOCK_DATA = {
  bride_prep_address: 'The Orangery, Ashford Rd, Maidstone ME14 5PP',
  groom_prep_address: "Step dad's house, 5 Sapphire Park, Sutton Valence, Maidstone ME17 3XZ",
  first_look: 'no',
  ceremony_location: 'The Orangery, Ashford Road, Turkey Mill Court, Maidstone ME14 5PP',
  departure_time: '13:00',
  ceremony_time: '13:30',
  reception_location: 'The Orangery, Maidstone ME14 5PP',
  wedding_breakfast_time: '15:30',
  hot_meal_arranged: 'yes',
  speeches_timing: 'after',
  emergency_contact: 'Hannah Marsh (bridesmaid) 07891619109',
  names_for_slideshow: 'Jake & Paige',
  aisle_escort: 'Her father',
  first_dance_song: 'Over and Over Again — Nathan Sykes',
  choreographed_dance: 'No',
  unique_elements: 'Patrick Keys pianist during drinks reception',
  honeymoon_plans: 'Maldives — April 2026',
  social_media: 'Instagram @_pr95_ @jakeehu95',
  hashtag: '#WillisHughes2026',
  venue_contact: 'The Orangery',
  makeup_artist: '@Hollienoelle.hmua',
  hair_stylist: '@brookefelthamvl',
  florist: 'Floral Explosion',
  cake: '@charlottescakekitchen',
  videographer: '@just.marriedmoments',
  stationery: '@foreverpaperco',
  additional_vendors: '@patrickkeyz pianist',
}

export default function PreviewQuestionnaire() {
  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/preview" className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a] mb-8 transition-colors">
        <ChevronLeft size={14} /> Back
      </Link>
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">Questionnaire</h1>
        <Divider />
        <p className="text-sm text-[#888] mt-4 max-w-md mx-auto">
          Your answers help us plan the perfect coverage for your wedding day.
        </p>
      </div>
      <QuestionnaireForm
        clientId="preview"
        slug="preview"
        partner1="Paige"
        partner2="Jake"
        coupleType="bg"
        ceremonyVenue="The Orangery, Maidstone"
        ceremonyTime="13:30"
        receptionVenue={null}
        daysUntil={180}
        initialData={MOCK_DATA}
        isCompleted={false}
      />
    </div>
  )
}
