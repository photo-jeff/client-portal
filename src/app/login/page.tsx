import { Metadata } from 'next'
import { LoginForm } from './LoginForm'
import { Divider } from '@/components/ui/Divider'

export const metadata: Metadata = { title: 'Sign In | Jeff Oliver Photography' }

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: '#faf9f7' }}>
      <div className="w-full max-w-md text-center">
        <h1 className="font-serif text-4xl mb-2">Jeff Oliver Photography</h1>
        <Divider />
        <p className="text-xs tracking-[0.15em] uppercase text-[#888] mt-4 mb-10">Client Portal</p>

        <div className="bg-white border border-[#e0ddd8] p-10">
          <h2 className="font-serif text-2xl mb-2">Welcome</h2>
          <p className="text-sm text-[#888] mb-8">
            Enter your email address and we'll send you a secure sign-in link.
          </p>
          <LoginForm />
        </div>

        <p className="text-xs text-[#aaa] mt-8">
          Questions? Email us at{' '}
          <a href="mailto:hello@jeffoliverphotography.com" className="underline hover:text-[#1a1a1a]">
            hello@jeffoliverphotography.com
          </a>
        </p>
      </div>
    </main>
  )
}
