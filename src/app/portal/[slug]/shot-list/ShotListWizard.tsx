'use client'
import { useState, useEffect, useRef } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  hidden?: boolean
}

interface Props {
  slug: string
  partner1: string
  partner2: string
  weddingDate: string | null
  existingList: string | null
}

export function ShotListWizard({ slug, partner1, partner2, weddingDate, existingList }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [shotListReady, setShotListReady] = useState<string | null>(existingList)
  const [started, setStarted] = useState(false)
  const [saved, setSaved] = useState(!!existingList)
  const [copying, setCopying] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function startConversation() {
    setStarted(true)
    setLoading(true)
    // Pass names and date upfront so Claude never asks for them
    const dateStr = weddingDate
      ? new Date(weddingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : null
    const openingMsg = `Hi! We're ${partner1} and ${partner2} and we'd like to build our group shot list please.${dateStr ? ` Our wedding date is ${dateStr}.` : ''}`
    try {
      const res = await fetch('/api/portal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: openingMsg }] }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Service error (${res.status})`)
      }
      const data = await res.json()
      const reply = data.content?.find((b: { type: string }) => b.type === 'text')?.text
      if (!reply) throw new Error('Empty response from AI')
      setMessages([
        { role: 'user', content: openingMsg, hidden: true },
        { role: 'assistant', content: reply },
      ])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong'
      setMessages([{ role: 'assistant', content: `Sorry — ${msg}. Please try again in a moment.` }])
    }
    setLoading(false)
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const apiMessages = newMessages
        .filter(m => !m.hidden)
        .map(m => ({ role: m.role, content: m.content }))

      // Ensure strictly alternating roles (API requirement)
      const cleaned: { role: string; content: string }[] = []
      for (const msg of apiMessages) {
        if (cleaned.length === 0 || msg.role !== cleaned[cleaned.length - 1].role) {
          cleaned.push(msg)
        }
      }

      const res = await fetch('/api/portal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: cleaned }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Service error (${res.status})`)
      }
      const data = await res.json()
      const reply = data.content?.find((b: { type: string }) => b.type === 'text')?.text
      if (!reply) throw new Error('Empty response from AI')

      if (reply!.includes('YOUR SHOT LIST IS READY:')) {
        const [before, after] = reply.split('YOUR SHOT LIST IS READY:')
        const listText = after.trim()
        setShotListReady(listText)
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: (before.trim() ? before.trim() + '\n\n' : '') + '✨ Your shot list is ready below!',
          },
        ])
        // Save to database
        await fetch('/api/portal/shot-list-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, text: listText }),
        })
        setSaved(true)
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    }
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  async function copyToClipboard() {
    if (!shotListReady) return
    await navigator.clipboard.writeText(shotListReady)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  function restartWizard() {
    setShotListReady(null)
    setMessages([])
    setStarted(false)
    setSaved(false)
  }

  // ── Already completed — show saved list ──
  if (shotListReady && !started) {
    return (
      <div className="space-y-6">
        <div
          style={{
            background: '#1a1a1a',
            borderRadius: '8px',
            padding: '28px',
          }}
        >
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#C9A96E', marginBottom: '16px', fontWeight: 300, letterSpacing: '0.5px' }}>
            ✨ Your Shot List
          </p>
          <pre style={{ fontSize: '13px', lineHeight: 1.85, fontWeight: 300, whiteSpace: 'pre-wrap', color: '#e8e8e8', fontFamily: 'inherit', margin: 0 }}>
            {shotListReady}
          </pre>
          <div className="flex gap-3 mt-5">
            <button
              onClick={copyToClipboard}
              style={{
                background: 'transparent',
                border: '1px solid #C9A96E',
                color: '#C9A96E',
                padding: '8px 20px',
                fontSize: '11px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              {copying ? 'Copied ✓' : 'Copy to clipboard'}
            </button>
            <button
              onClick={restartWizard}
              style={{
                background: 'transparent',
                border: '1px solid #555',
                color: '#888',
                padding: '8px 20px',
                fontSize: '11px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Start over
            </button>
          </div>
        </div>
        <p className="text-xs text-center text-[#aaa]">
          This list has been saved. Jeff will bring a printed copy on the day.
        </p>
      </div>
    )
  }

  // ── Not started yet — intro screen ──
  if (!started) {
    return (
      <div
        className="text-center py-12 px-8"
        style={{ background: '#1a1a1a', borderRadius: '8px' }}
      >
        <style>{`
          @keyframes jop-bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-6px); }
          }
        `}</style>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: 300, color: '#fff', lineHeight: 1.2, marginBottom: '16px' }}>
          Let&apos;s sort your<br />group shots 📸
        </h2>
        <p style={{ fontSize: '14px', color: '#aaa', lineHeight: 1.75, maxWidth: '400px', margin: '0 auto 32px', fontWeight: 300 }}>
          Instead of a form, we&apos;ll have a quick chat — usually around 10 minutes — and build your personalised list together. We&apos;ll make sure we don&apos;t miss anyone important.
        </p>
        <button
          onClick={startConversation}
          style={{
            background: 'transparent',
            color: '#C9A96E',
            border: '1px solid #C9A96E',
            padding: '14px 36px',
            fontSize: '12px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Let&apos;s get started
        </button>
      </div>
    )
  }

  // ── Chat in progress ──
  return (
    <div style={{ background: '#1a1a1a', borderRadius: '8px', display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
      <style>{`
        @keyframes jop-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .jop-dot { animation: jop-bounce 1.2s infinite; }
        .jop-input:focus { border-color: #C9A96E !important; outline: none; }
      `}</style>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        {messages.filter(m => !m.hidden).map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '12px 16px',
                background: msg.role === 'user' ? '#2a2a2a' : '#fff',
                color: msg.role === 'user' ? '#C9A96E' : '#1a1a1a',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                fontSize: '14px',
                lineHeight: 1.65,
                fontWeight: 300,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '14px 18px', background: '#fff', borderRadius: '18px 18px 18px 4px' }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <div
                  key={i}
                  className="jop-dot"
                  style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#C9A96E', animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {shotListReady && (
          <div style={{ background: '#111', borderRadius: '12px', padding: '24px', margin: '16px 0' }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#C9A96E', marginBottom: '14px', fontWeight: 300 }}>✨ Your Shot List</p>
            <pre style={{ fontSize: '13px', lineHeight: 1.85, fontWeight: 300, whiteSpace: 'pre-wrap', color: '#e8e8e8', fontFamily: 'inherit', margin: 0 }}>
              {shotListReady}
            </pre>
            <div className="flex gap-3 mt-5">
              <button
                onClick={copyToClipboard}
                style={{ background: 'transparent', border: '1px solid #C9A96E', color: '#C9A96E', padding: '8px 20px', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                {copying ? 'Copied ✓' : 'Copy to clipboard'}
              </button>
            </div>
            {saved && (
              <p style={{ fontSize: '12px', color: '#666', marginTop: '12px' }}>
                Saved ✓ — Jeff will bring a printed copy on the day.
              </p>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!shotListReady && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2a2a', display: 'flex', gap: '10px' }}>
          <textarea
            ref={inputRef}
            rows={1}
            className="jop-input"
            style={{
              flex: 1,
              border: '1px solid #333',
              borderRadius: '24px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 300,
              background: '#111',
              color: '#fff',
              resize: 'none',
              fontFamily: 'inherit',
            }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your reply…"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{
              background: '#C9A96E',
              border: 'none',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              alignSelf: 'flex-end',
              opacity: loading ? 0.5 : 1,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
