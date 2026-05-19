'use client'
import { useState, useRef, useEffect } from 'react'

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
  ceremonyVenue: string | null
  receptionVenue: string | null
  initialData: Record<string, unknown> | null
  isCompleted: boolean
}

export function QuestionnaireWizard({
  slug,
  partner1,
  partner2,
  weddingDate,
  ceremonyVenue,
  receptionVenue,
  initialData,
  isCompleted,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [saved, setSaved] = useState(isCompleted)
  const [saving, setSaving] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function startConversation() {
    setStarted(true)
    setLoading(true)

    const hasExisting = initialData && Object.keys(initialData).length > 0
    const openingMsg = hasExisting
      ? `Hi, I'm ${partner1}. I'd like to review and update some of our questionnaire answers.`
      : `Hi, I'm ${partner1}. We'd like to complete our wedding photography questionnaire.`

    try {
      const res = await fetch('/api/portal/questionnaire-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          messages: [{ role: 'user', content: openingMsg }],
        }),
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
      setMessages([{ role: 'assistant', content: `Sorry — ${msg}. Please try again.` }])
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

      // Enforce strictly alternating roles
      const cleaned: { role: string; content: string }[] = []
      for (const msg of apiMessages) {
        if (cleaned.length === 0 || msg.role !== cleaned[cleaned.length - 1].role) {
          cleaned.push(msg)
        }
      }

      const res = await fetch('/api/portal/questionnaire-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, messages: cleaned }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Service error (${res.status})`)
      }
      const data = await res.json()
      const reply = data.content?.find((b: { type: string }) => b.type === 'text')?.text
      if (!reply) throw new Error('Empty response from AI')

      if (reply.includes('QUESTIONNAIRE_COMPLETE:')) {
        await handleCompletion(reply)
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

  async function handleCompletion(reply: string) {
    const splitIdx = reply.indexOf('QUESTIONNAIRE_COMPLETE:')
    const visibleText = reply.slice(0, splitIdx).trim()
    const jsonPart = reply.slice(splitIdx + 'QUESTIONNAIRE_COMPLETE:'.length).trim()

    // Show the wrap-up message (without the JSON block)
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: visibleText || 'Your questionnaire is all saved. ✓' },
    ])

    // Extract and parse the JSON
    const jsonMatch = jsonPart.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return

    try {
      setSaving(true)
      const extractedData = JSON.parse(jsonMatch[0])

      await fetch('/api/portal/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          data: extractedData,
          completed_at: new Date().toISOString(),
        }),
      })

      setSaved(true)
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "I couldn't save that. Please try sending your last message again." },
      ])
    } finally {
      setSaving(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function startOver() {
    setMessages([])
    setStarted(false)
    setSaved(false)
  }

  // ── Pre-start: completed previously ──
  if (!started && isCompleted) {
    return (
      <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '40px 32px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 300, color: '#fff', marginBottom: '12px' }}>
          Questionnaire saved ✓
        </p>
        <p style={{ fontSize: '14px', color: '#aaa', lineHeight: 1.7, maxWidth: '360px', margin: '0 auto 32px', fontWeight: 300 }}>
          We have all your answers. If anything&apos;s changed — a supplier, a time, or anything else — just start a new chat and we&apos;ll update it.
        </p>
        <button
          onClick={startConversation}
          style={{
            background: 'transparent',
            color: '#C9A96E',
            border: '1px solid #C9A96E',
            padding: '12px 32px',
            fontSize: '12px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Update an answer
        </button>
      </div>
    )
  }

  // ── Pre-start: first time ──
  if (!started) {
    return (
      <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '40px 32px', textAlign: 'center' }}>
        <style>{`
          @keyframes jop-bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-6px); }
          }
        `}</style>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 300, color: '#fff', marginBottom: '12px' }}>
          Let&apos;s talk through your day
        </h2>
        <p style={{ fontSize: '14px', color: '#aaa', lineHeight: 1.75, maxWidth: '380px', margin: '0 auto 32px', fontWeight: 300 }}>
          Instead of a form, we&apos;ll have a quick chat — usually around 15 minutes. We&apos;ll cover everything from getting-ready locations to suppliers, so we&apos;re fully prepared on your day.
        </p>
        {weddingDate && (
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '28px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {new Date(weddingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            {ceremonyVenue && ` · ${ceremonyVenue}`}
          </p>
        )}
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

  // ── Chat interface ──
  return (
    <div style={{ background: '#1a1a1a', borderRadius: '8px', display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
      <style>{`
        @keyframes jop-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .jop-dot { animation: jop-bounce 1.2s infinite; }
        .jop-q-input:focus { border-color: #C9A96E !important; outline: none; }
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

        {(loading || saving) && (
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

        {saved && (
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Questionnaire saved ✓</p>
            <button
              onClick={startOver}
              style={{ background: 'transparent', border: '1px solid #333', color: '#888', padding: '8px 20px', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Update an answer
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!saved && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2a2a', display: 'flex', gap: '10px' }}>
          <textarea
            ref={inputRef}
            rows={1}
            className="jop-q-input"
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
            disabled={loading || saving}
          />
          <button
            onClick={sendMessage}
            disabled={loading || saving}
            style={{
              background: '#C9A96E',
              border: 'none',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              cursor: (loading || saving) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              alignSelf: 'flex-end',
              opacity: (loading || saving) ? 0.5 : 1,
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
