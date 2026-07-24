const SOCIALS = [
  {
    name: 'Instagram',
    href: 'https://instagram.com/jeffoliverphotography',
    path: (
      <>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </>
    ),
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com/jeffoliverphotography',
    path: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com/@jeffoliverphotography',
    // TikTok has no lucide glyph — inline the brand mark (filled path).
    path: (
      <path
        d="M16.5 3c.3 2.1 1.6 3.8 3.5 4.2v2.6c-1.3 0-2.6-.4-3.7-1.1v5.7a5.3 5.3 0 1 1-5.3-5.3c.3 0 .6 0 .8.1v2.7a2.6 2.6 0 1 0 1.8 2.5V3z"
        fill="currentColor"
        stroke="none"
      />
    ),
  },
]

export function PortalFooter() {
  return (
    <footer className="border-t border-[#f0ede8] mt-16">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-6">
          {SOCIALS.map(s => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.name}
              className="text-[#b5b8ba] hover:text-[#1a1a1a] transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {s.path}
              </svg>
            </a>
          ))}
        </div>
        <p className="text-xs text-[#c2c5c8]">
          © {new Date().getFullYear()} Jeff Oliver Photography
        </p>
      </div>
    </footer>
  )
}
