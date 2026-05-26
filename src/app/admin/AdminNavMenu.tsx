'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const NAV_ITEMS = [
  { label: 'New portal', href: '/admin/clients/new', highlight: true },
  { label: 'Archive', href: '/admin/archive' },
  { label: 'Email settings', href: '/admin/email-settings' },
  { label: 'Meeting settings', href: '/admin/meeting-settings' },
  { label: 'FAQ', href: '/admin/faq' },
  { label: 'Pre-wed FAQ', href: '/admin/prewed-faq' },
]

export function AdminNavMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Menu"
        className="flex flex-col justify-center items-center gap-[5px] w-9 h-9 rounded hover:bg-[#f0ede8] transition-colors"
      >
        <span
          className="block w-5 h-[1.5px] bg-[#535353] transition-transform duration-200"
          style={{ transform: open ? 'translateY(6.5px) rotate(45deg)' : undefined }}
        />
        <span
          className="block w-5 h-[1.5px] bg-[#535353] transition-opacity duration-200"
          style={{ opacity: open ? 0 : 1 }}
        />
        <span
          className="block w-5 h-[1.5px] bg-[#535353] transition-transform duration-200"
          style={{ transform: open ? 'translateY(-6.5px) rotate(-45deg)' : undefined }}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#e0ddd8] rounded-xl shadow-lg py-1 z-50">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2.5 text-sm transition-colors hover:bg-[#faf9f7] ${
                item.highlight
                  ? 'text-[#C9A96E] font-medium'
                  : 'text-[#535353]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
