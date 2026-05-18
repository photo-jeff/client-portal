'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

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
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-white border-b border-[#e0ddd8] relative z-40">
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href={base} className="flex items-center shrink-0" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/JOP Logo.svg"
            alt="Jeff Oliver Photography"
            className="h-9 w-auto"
          />
        </Link>
        <div className="flex items-center gap-5">
          <p className="text-xs tracking-[0.12em] uppercase text-[#919295] hidden sm:block">{partnerNames}</p>
          <button
            onClick={() => setOpen(o => !o)}
            className="text-[#535353] hover:text-[#919295] transition-colors p-1"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-[#e0ddd8] shadow-sm">
          <nav className="max-w-5xl mx-auto px-6 py-5">
            <ul className="space-y-0">
              {navItems.map(({ label, href }) => {
                const fullHref = `${base}${href}`
                const isActive = href === '' ? pathname === base : pathname.startsWith(fullHref)
                return (
                  <li key={label}>
                    <Link
                      href={fullHref}
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between py-3 border-b border-[#f0ede8] last:border-0 text-xs tracking-[0.12em] uppercase transition-colors ${
                        isActive ? 'text-[#535353]' : 'text-[#919295] hover:text-[#535353]'
                      }`}
                    >
                      {label}
                      {isActive && <span className="w-4 h-px bg-[#C9A96E]" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
            <p className="text-xs tracking-[0.12em] uppercase text-[#919295] mt-5 sm:hidden">{partnerNames}</p>
          </nav>
        </div>
      )}
    </header>
  )
}
