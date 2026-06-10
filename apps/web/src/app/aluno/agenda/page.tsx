'use client'
import { useEffect, useState } from 'react'
import { getLessons, createLesson } from '../../../lib/api'

interface LessonStudent { student: { id: string; user: { id: string; name: string } } }
interface Lesson {
  id: string; title: string; type: 'INDIVIDUAL' | 'GROUP'; date: string
  time: string; durationMinutes: number; status: 'CONFIRMED' | 'PENDING' | 'CANCELLED'
  instructor: { id: string; name: string }; students: LessonStudent[]
}

function toISO(d: Date) { return d.toISOString().split('T')[0] }

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-state-mastered-bg text-state-mastered border-state-mastered-border',
  PENDING:   'bg-state-developing-bg text-state-developing border-state-developing-border',
  CANCELLED: 'bg-brand-red-dim text-brand-red border-brand-red-border',
}
const STATUS_LABELS: Record<string, string> = { CONFIRMED: 'Confirmado', PENDING: 'Pendente', CANCELLED: 'Cancelado' }

export default function StudentAgenda() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ date: toISO(new Date()), time: '09:00' })
  const [requesting, setRequesting] = useState(false)
  const [success, setSuccess] = useState(false)

  const today = toISO(new Date())
  const twoWeeksOut = toISO(new Date(Date.now() + 14 * 86400000))

  const fetchLessons = () => {
    setLoading(true)
    getLessons({ from: today, to: twoWeeksOut })
      .then(d => { setLessons(d.lessons); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchLessons() }, [])

  const todayLessons = lessons.filter(l => l.date.startsWith(today))
  const upcoming = lessons.filter(l => !l.date.startsWith(today))

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault(); setRequesting(true); setSuccess(false)
    try {
      await createLesson({ title: 'Aula individual', type: 'INDIVIDUAL', date: form.date, time: form.time })
      setSuccess(true)
      setForm({ date: toISO(new Date()), time: '09:00' })
      fetchLessons()
    } finally { setRequesting(false) }
  }

  const formatDate = (iso: string) =>
    new Date(iso + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div>
      <div className="text-[9px] tracking-widest text-brand-red mb-1">AGENDA</div>
      <div className="text-xl font-medium mb-5">Minhas aulas</div>

      {loading ? (
        <div className="text-text-muted text-sm">Carregando...</div>
      ) : (
        <>
          {/* Today */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] tracking-widest text-text-hint whitespace-nowrap">HOJE</span>
              <div className="flex-1 h-px bg-surface-border" />
            </div>
            {todayLessons.length === 0 ? (
              <div className="text-text-muted text-sm">Nenhuma aula hoje.</div>
            ) : (
              <div className="space-y-2">
                {todayLessons.map(l => <LessonCard key={l.id} lesson={l} />)}
              </div>
            )}
          </div>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] tracking-widest text-text-hint whitespace-nowrap">PRÓXIMAS AULAS</span>
                <div className="flex-1 h-px bg-surface-border" />
              </div>
              <div className="space-y-2">
                {upcoming.map(l => <LessonCard key={l.id} lesson={l} showDate />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Request form */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4">
        <div className="text-[9px] tracking-widest text-text-hint mb-3">SOLICITAR AULA</div>
        <form onSubmit={handleRequest} className="space-y-2.5">
          <div className="flex gap-2">
            <input type="date" value={form.date} min={today}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required
              className="flex-1 bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
            <input type="time" value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required
              className="w-28 bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
          </div>
          {success && (
            <div className="bg-state-mastered-bg border border-state-mastered-border rounded-lg px-4 py-3">
              <p className="text-xs text-state-mastered font-medium">Solicitação enviada! Aguarde confirmação do professor.</p>
            </div>
          )}
          <button type="submit" disabled={requesting}
            className="w-full bg-brand-red text-white text-xs font-medium py-2.5 rounded-lg disabled:opacity-50">
            {requesting ? 'Enviando...' : 'Solicitar aula'}
          </button>
        </form>
      </div>
    </div>
  )
}

function LessonCard({ lesson, showDate }: { lesson: Lesson; showDate?: boolean }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="text-center flex-shrink-0 w-14">
        {showDate && (
          <div className="text-[9px] text-text-hint mb-0.5">
            {new Date(lesson.date + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        )}
        <div className="text-sm font-medium text-brand-red">{lesson.time}</div>
        <div className="text-[9px] text-text-muted">{lesson.durationMinutes}min</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{lesson.title}</div>
        <div className="text-xs text-text-muted mt-0.5">Prof. {lesson.instructor.name}</div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[9px] px-1.5 py-0.5 rounded-sm border bg-surface-elevated border-surface-border text-text-muted">
            {lesson.type === 'INDIVIDUAL' ? 'INDIVIDUAL' : `TURMA · ${lesson.students.length}`}
          </span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border ${STATUS_STYLES[lesson.status]}`}>
            {STATUS_LABELS[lesson.status]}
          </span>
        </div>
      </div>
    </div>
  )
}
