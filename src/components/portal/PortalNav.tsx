'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

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
  { label: 'Important Info', href: '/important-info' },
]

export function PortalNav({ slug, partnerNames }: NavProps) {
  const pathname = usePathname()
  const base = `/portal/${slug}`

  return (
    <header className="bg-white border-b border-[#e0ddd8]">
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo text - matches website style */}
          <Link href={base} className="font-serif text-xl tracking-wide text-[#1a1a1a]">
            Jeff Oliver Photography
          </Link>
        </div>
        <p className="text-xs tracking-[0.12em] uppercase text-[#888]">{partnerNames}</p>
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
                        ? 'border-[#1a1a1a] text-[#1a1a1a]'
                        : 'border-transparent text-[#888] hover:text-[#1a1a1a]'
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
