import { Metadata } from 'next'
import { LoginForm } from './LoginForm'
import { Divider } from '@/components/ui/Divider'

export const metadata: Metadata = { title: 'Sign In | Jeff Oliver Photography' }

export default function LoginPage() {
  return (
    <main className="min-h-screen flex">

      {/* Photo panel — desktop only */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/B_and_L-019.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-8 py-16 bg-white">
        <div className="w-full max-w-sm text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/JOP Logo.svg"
            alt="Jeff Oliver Photography"
            className="h-5 w-auto mx-auto mb-4"
          />
          <Divider />
          <p className="text-xs tracking-[0.15em] uppercase text-[#919295] mt-4 mb-10">Client Portal</p>

          <div className="bg-white border border-[#e0ddd8] p-10">
            <h2 className="font-serif text-2xl mb-2">Welcome</h2>
            <p className="text-sm text-[#919295] mb-8">
              Enter your email address and we&apos;ll send you a secure sign-in link.
            </p>
            <LoginForm />
          </div>

          <p className="text-xs text-[#b5b8ba] mt-8">
            Questions? Email us at{' '}
            <a href="mailto:hello@jeffoliverphotography.com" className="underline hover:text-[#535353]">
              hello@jeffoliverphotography.com
            </a>
          </p>
        </div>
      </div>

    </main>
  )
}
