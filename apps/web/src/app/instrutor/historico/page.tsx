'use client'
import { useState, useEffect } from 'react'
import { getHistory } from '../../../lib/api'

type EventType = 'advance' | 'evaluation' | 'intake'

interface HistoryEvent {
  id: string
  type: EventType
  studentName: string
  description: string
  date: string
}

/* ── Date helpers ───────────────────────────────────────────────────────────── */

function dayKey(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function dayLabel(dateStr: string): string {
  const eventDate = new Date(dateStr)
  const now = new Date()

  const toLocal = (d: Date) =>
    new Date(d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }))

  const today = toLocal(now)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const evDay = toLocal(eventDate)

  if (evDay.getTime() === today.getTime()) return 'Hoje'
  if (evDay.getTime() === yesterday.getTime()) return 'Ontem'

  return eventDate.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  })
}

function timeStr(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

/* ── Event styling ──────────────────────────────────────────────────────────── */

const EVENT_CONFIG: Record<EventType, { label: string; bar: string; chip: string }> = {
  advance: {
    label: 'AVANÇO',
    bar: 'bg-brand-red',
    chip: 'bg-brand-red-dim text-brand-red border-brand-red-border',
  },
  evaluation: {
    label: 'AVALIAÇÃO',
    bar: 'bg-amber-500',
    chip: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
  },
  intake: {
    label: 'INGRESSO',
    bar: 'bg-brand-red',
    chip: 'bg-brand-red-dim text-brand-red border-brand-red-border',
  },
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function HistoricoPage() {
  const [events, setEvents] = useState<HistoryEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(50)
  const [hasMore, setHasMore] = useState(false)

  const load = async (l: number) => {
    setLoading(true)
    try {
      const data = await getHistory(l)
      const list: HistoryEvent[] = data.events ?? []
      setEvents(list)
      setHasMore(list.length === l)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(limit) }, [])

  const loadMore = () => {
    const next = limit + 50
    setLimit(next)
    load(next)
  }

  // Group events by day
  const groups: { key: string; label: string; events: HistoryEvent[] }[] = []
  const seen = new Map<string, HistoryEvent[]>()

  for (const ev of events) {
    const k = dayKey(ev.date)
    if (!seen.has(k)) {
      seen.set(k, [])
      groups.push({ key: k, label: dayLabel(ev.date), events: seen.get(k)! })
    }
    seen.get(k)!.push(ev)
  }

  return (
    <div>
      <div className="text-[9px] tracking-widest text-brand-red mb-1">ACADEMIA</div>
      <div className="text-xl font-medium mb-1">Histórico</div>
      <div className="text-xs text-text-muted mb-5">Registro cronológico de eventos</div>

      {loading && events.length === 0 ? (
        <div className="text-text-muted text-sm">Carregando...</div>
      ) : events.length === 0 ? (
        <div className="bg-surface-card border border-surface-border rounded-xl p-8 text-center">
          <p className="text-text-muted text-sm">Nenhum evento registrado ainda.</p>
          <p className="text-text-hint text-xs mt-1">
            Avaliações, avanços e ingressos aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <section key={group.key}>
              {/* Day header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] tracking-widest text-text-hint whitespace-nowrap">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-surface-border" />
              </div>

              {/* Events */}
              <div className="space-y-2">
                {group.events.map(ev => {
                  const cfg = EVENT_CONFIG[ev.type]
                  return (
                    <div
                      key={ev.id}
                      className="bg-surface-card border border-surface-border rounded-xl overflow-hidden flex"
                    >
                      {/* Colored accent bar */}
                      <div className={`w-1 flex-shrink-0 ${cfg.bar}`} />

                      <div className="flex-1 px-4 py-3 flex items-center justify-between gap-3 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`text-[8px] font-medium px-2 py-0.5 rounded-sm border flex-shrink-0 tracking-wide ${cfg.chip}`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-text-secondary leading-relaxed truncate">
                            {ev.description}
                          </span>
                        </div>
                        <span className="text-[10px] text-text-hint flex-shrink-0 tabular-nums">
                          {timeStr(ev.date)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full border border-surface-border text-text-muted text-xs py-2.5 rounded-xl hover:border-surface-elevated transition-colors disabled:opacity-50"
            >
              {loading ? 'Carregando...' : 'Carregar mais'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
