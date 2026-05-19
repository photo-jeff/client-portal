'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'magic' | 'password'>('magic')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'password') {
      // Server-side sign-in so cookies are set on the response and readable by SSR
      try {
        const res = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) {
          setError('Incorrect email or password.')
          setLoading(false)
        } else {
          const { redirectTo } = await res.json()
          window.location.href = redirectTo
        }
      } catch {
        setError('Something went wrong. Please try again.')
        setLoading(false)
      }
    } else {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) {
        setError('Something went wrong. Please try again.')
        setLoading(false)
      } else {
        setSent(true)
        setLoading(false)
      }
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border border-[#535353] flex items-center justify-center mx-auto mb-4">
          <span className="text-lg">✓</span>
        </div>
        <p className="font-serif text-xl">Check your email</p>
        <p className="text-sm text-[#919295]">
          We&apos;ve sent a sign-in link to <strong>{email}</strong>
        </p>
        <p className="text-xs text-[#b5b8ba] mt-4">The link expires in 1 hour.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Email address"
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        autoComplete="email"
      />
      {mode === 'password' && (
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Button variant="filled" className="w-full" type="submit" disabled={loading}>
        {loading ? '…' : mode === 'password' ? 'Sign in' : 'Send sign-in link'}
      </Button>
      <p className="text-center text-xs text-[#b5b8ba]">
        {mode === 'magic' ? (
          <button type="button" onClick={() => { setMode('password'); setError('') }} className="underline hover:text-[#535353] transition-colors">
            Sign in with password instead
          </button>
        ) : (
          <button type="button" onClick={() => { setMode('magic'); setError('') }} className="underline hover:text-[#535353] transition-colors">
            Send a magic link instead
          </button>
        )}
      </p>
    </form>
  )
}
