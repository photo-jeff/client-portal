export interface Client {
  id: string
  email: string
  partner1_name: string
  partner2_name: string
  wedding_date: string | null
  vsco_job_id: string | null
  zoho_contact_id: string | null
  portal_slug: string
  created_at: string
  invite_sent_at: string | null
}

export interface QuestionnaireData {
  // Section 1: Wedding Day Timeline
  bride_prep_address: string
  groom_prep_address: string
  first_look: 'yes' | 'no' | null
  ceremony_location: string
  departure_time: string // HH:MM
  ceremony_time: string // HH:MM
  reception_location: string
  wedding_breakfast_time: string
  hot_meal_arranged: boolean
  speeches_timing: 'before' | 'during' | 'after' | null
  emergency_contact: string
  // Section 2: The Details
  names_for_slideshow: string
  aisle_escort: string
  first_dance_song: string
  choreographed_dance: string
  unique_elements: string
  honeymoon_plans: string
  social_media: string
  hashtag: string
  // Section 3: Vendors
  venue_contact: string
  wedding_planner: string
  wedding_dress: string
  groom_suit: string
  makeup_artist: string
  hair_stylist: string
  florist: string
  venue_styling: string
  cake: string
  videographer: string
  stationery: string
  catering: string
  transport: string
  dj_band: string
  photo_booth: string
  jeweller: string
  additional_vendors: string
}

export interface ShotListItem {
  id: string
  client_id: string
  category: string
  description: string
  people: string
  sort_order: number
}

export interface Invoice {
  id: string
  invoice_number: string
  date: string
  due_date: string | null
  total: number
  balance: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
  payment_url: string | null
  currency_symbol: string
}

export type PortalSection = 'wedding-details' | 'questionnaire' | 'shot-list' | 'invoices' | 'important-info'

export interface PortalProgress {
  questionnaire_completed: boolean
  shot_list_completed: boolean
  balance_paid: boolean
}
