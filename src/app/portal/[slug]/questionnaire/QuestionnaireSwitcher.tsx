'use client'
import { useState } from 'react'
import { QuestionnaireWizard } from './QuestionnaireWizard'
import { QuestionnaireForm } from './QuestionnaireForm'
import type { CoupleType } from '@/lib/couple-type'

interface Props {
  clientId: string
  slug: string
  partner1: string
  partner2: string
  coupleType: CoupleType
  weddingDate: string | null
  ceremonyVenue: string | null
  ceremonyTime: string | null
  receptionVenue: string | null
  daysUntil: number | null
  initialData: Record<string, unknown> | null
  isCompleted: boolean
}

export function QuestionnaireSwitcher(props: Props) {
  const [mode, setMode] = useState<'chat' | 'form'>('chat')

  if (mode === 'form') {
    return (
      <div>
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setMode('chat')}
            className="text-xs tracking-[0.08em] uppercase text-[#919295] hover:text-[#535353] transition-colors"
          >
            ← Back to chat
          </button>
        </div>
        <QuestionnaireForm
          clientId={props.clientId}
          slug={props.slug}
          partner1={props.partner1}
          partner2={props.partner2}
          coupleType={props.coupleType}
          ceremonyVenue={props.ceremonyVenue}
          ceremonyTime={props.ceremonyTime}
          receptionVenue={props.receptionVenue}
          daysUntil={props.daysUntil}
          initialData={props.initialData}
          isCompleted={props.isCompleted}
        />
      </div>
    )
  }

  return (
    <QuestionnaireWizard
      slug={props.slug}
      partner1={props.partner1}
      partner2={props.partner2}
      weddingDate={props.weddingDate}
      ceremonyVenue={props.ceremonyVenue}
      receptionVenue={props.receptionVenue}
      initialData={props.initialData}
      isCompleted={props.isCompleted}
      onSwitchToForm={() => setMode('form')}
    />
  )
}
