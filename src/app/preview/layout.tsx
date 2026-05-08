import { PortalNav } from '@/components/portal/PortalNav'

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      <PortalNav slug="preview" partnerNames="Paige & Jake" />
      <main className="max-w-5xl mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  )
}
