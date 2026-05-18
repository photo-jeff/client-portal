'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavProps {
  slug: string
  partnerNames: string
}

const navItems = [
  { label: 'Dashboard', href: '' },
  { label: 'Wedding Details', href: '/wedding-details' },
  { label: 'Questionnaire', href: '/questionnaire' },
  { label: 'Shot List', href: '/shot-list' },
  { label: 'Invoices', href: '/invoices' },
  { label: 'For Your Venue', href: '/venue-info' },
]

export function PortalNav({ slug, partnerNames }: NavProps) {
  const pathname = usePathname()
  const base = `/portal/${slug}`

  return (
    <header className="bg-white border-b border-[#e0ddd8]">
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={base} className="font-display text-base tracking-[0.12em] uppercase text-[#535353]">
            Jeff Oliver Photography
          </Link>
        </div>
        <p className="text-xs tracking-[0.12em] uppercase text-[#919295]">{partnerNames}</p>
      </div>
      <nav className="border-t border-[#e0ddd8]">
        <div className="max-w-5xl mx-auto px-6">
          <ul className="flex gap-0 overflow-x-auto">
            {navItems.map(({ label, href }) => {
              const fullHref = `${base}${href}`
              const isActive = href === '' ? pathname === base : pathname.startsWith(fullHref)
              return (
                <li key={label}>
                  <Link
                    href={fullHref}
                    className={`block py-4 px-4 text-xs tracking-[0.1em] uppercase font-medium whitespace-nowrap border-b-2 transition-colors ${
                      isActive
                        ? 'border-[#C9A96E] text-[#535353]'
                        : 'border-transparent text-[#919295] hover:text-[#535353]'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
    </header>
  )
}
