'use client'
import { useEffect, useState } from 'react'
import { getLessons, createLesson, updateLessonStudents, updateLessonStatus, deleteLesson, getStudents } from '../../../lib/api'

interface LessonStudent { student: { id: string; user: { id: string; name: string } } }
interface Lesson {
  id: string; title: string; type: 'INDIVIDUAL' | 'GROUP'; date: string
  time: string; durationMinutes: number; status: 'CONFIRMED' | 'PENDING' | 'CANCELLED'
  instructor: { id: string; name: string }; students: LessonStudent[]
}
interface Student { id: string; user: { name: string } }

function getWeekStart(d: Date) {
  const date = new Date(d); const day = date.getDay()
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1)); date.setHours(0,0,0,0); return date
}
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function toISO(d: Date) { return d.toISOString().split('T')[0] }
function fmt(d: Date, opts: Intl.DateTimeFormatOptions) { return d.toLocaleDateString('pt-BR', opts) }

const DAY_LABELS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-state-mastered-bg text-state-mastered border-state-mastered-border',
  PENDING:   'bg-state-developing-bg text-state-developing border-state-developing-border',
  CANCELLED: 'bg-brand-red-dim text-brand-red border-brand-red-border',
}
const STATUS_LABELS: Record<string, string> = { CONFIRMED: 'Confirmado', PENDING: 'Pendente', CANCELLED: 'Cancelado' }

export default function InstructorAgenda() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => toISO(new Date()))
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'INDIVIDUAL', date: toISO(new Date()), time: '09:00', duration_minutes: 60, student_ids: [] as string[] })
  const [saving, setSaving] = useState(false)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const from = toISO(weekStart)
  const to = toISO(addDays(weekStart, 6))

  const fetchLessons = () => {
    setLoading(true)
    getLessons({ from, to }).then(d => { setLessons(d.lessons); setLoading(false) })
  }

  useEffect(() => { fetchLessons() }, [from])
  useEffect(() => { getStudents('active').then(d => setAllStudents(d.students)) }, [])

  const dayLessons = lessons.filter(l => l.date.startsWith(selectedDay))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      await createLesson({ ...form })
      setShowForm(false); setForm({ title: '', type: 'INDIVIDUAL', date: selectedDay, time: '09:00', duration_minutes: 60, student_ids: [] })
      fetchLessons()
    } finally { setSaving(false) }
  }

  const handleAddStudent = async (lessonId: string, studentId: string) => {
    await updateLessonStudents(lessonId, [studentId], 'add'); fetchLessons()
  }
  const handleRemoveStudent = async (lessonId: string, studentId: string) => {
    await updateLessonStudents(lessonId, [studentId], 'remove'); fetchLessons()
  }
  const handleStatusChange = async (lessonId: string, status: string) => {
    await updateLessonStatus(lessonId, status); fetchLessons()
  }
  const handleDelete = async (lessonId: string) => {
    if (!window.confirm('Excluir esta aula?')) return
    await deleteLesson(lessonId); fetchLessons()
  }

  return (
    <div>
      <div className="text-[9px] tracking-widest text-brand-red mb-1">AGENDA</div>
      <div className="text-xl font-medium mb-4">Agenda</div>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setWeekStart(w => addDays(w, -7))} className="text-text-muted hover:text-brand-red text-sm px-2">←</button>
        <span className="text-xs text-text-muted">{fmt(weekStart, { day: 'numeric', month: 'short' })} – {fmt(addDays(weekStart,6), { day: 'numeric', month: 'short' })}</span>
        <button onClick={() => setWeekStart(w => addDays(w, 7))} className="text-text-muted hover:text-brand-red text-sm px-2">→</button>
      </div>

      {/* Day strip */}
      <div className="flex gap-1 mb-5 overflow-x-auto scrollbar-none">
        {weekDays.map((day, i) => {
          const iso = toISO(day); const isSelected = iso === selectedDay; const today = toISO(new Date()) === iso
          const count = lessons.filter(l => l.date.startsWith(iso)).length
          return (
            <button key={iso} onClick={() => setSelectedDay(iso)}
              className={`flex-1 min-w-[44px] flex flex-col items-center py-2 rounded-lg border transition-colors ${isSelected ? 'bg-brand-red text-white border-brand-red' : 'bg-surface-card border-surface-border text-text-muted hover:border-brand-red/40'}`}>
              <span className="text-[9px] tracking-wider">{DAY_LABELS[i]}</span>
              <span className={`text-sm font-medium ${today && !isSelected ? 'text-brand-red' : ''}`}>{day.getDate()}</span>
              {count > 0 && <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-brand-red'}`} />}
            </button>
          )
        })}
      </div>

      {/* Day heading */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium capitalize">{new Date(selectedDay + 'T12:00').toLocaleDateString('pt-BR',{ weekday:'long', day:'numeric', month:'long' })}</div>
        <button onClick={() => { setShowForm(f => !f); setForm(f => ({ ...f, date: selectedDay })) }}
          className="w-7 h-7 rounded-full bg-brand-red text-white flex items-center justify-center text-lg leading-none hover:opacity-90">+</button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-surface-card border border-surface-border border-l-2 border-l-brand-red rounded-xl p-4 mb-4">
          <div className="text-[9px] tracking-widest text-text-hint mb-3">NOVA AULA</div>
          <form onSubmit={handleCreate} className="space-y-2.5">
            <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="Título da aula" required
              className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
            <div className="flex rounded-lg border border-surface-border overflow-hidden">
              {(['INDIVIDUAL','GROUP'] as const).map(t => (
                <button key={t} type="button" onClick={() => setForm(f=>({...f,type:t,student_ids:[]}))}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${form.type===t ? 'bg-brand-red text-white' : 'bg-surface-card text-text-muted'}`}>
                  {t === 'INDIVIDUAL' ? 'Individual' : 'Turma'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} required
                className="flex-1 bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
              <input type="time" value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))} required
                className="w-28 bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
            </div>
            <input type="number" value={form.duration_minutes} min={15} onChange={e => setForm(f=>({...f,duration_minutes:Number(e.target.value)}))}
              placeholder="Duração (min)" className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
            {/* Student selector */}
            <div>
              <div className="text-[9px] tracking-widest text-text-hint mb-1.5">
                {form.type === 'INDIVIDUAL' ? 'ALUNO' : 'ALUNOS DA TURMA'}
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1">
                {allStudents.map(s => {
                  const selected = form.student_ids.includes(s.id)
                  return (
                    <button key={s.id} type="button"
                      onClick={() => setForm(f => {
                        if (f.type === 'INDIVIDUAL') return { ...f, student_ids: selected ? [] : [s.id] }
                        return { ...f, student_ids: selected ? f.student_ids.filter(id=>id!==s.id) : [...f.student_ids, s.id] }
                      })}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${selected ? 'bg-brand-red-dim border-brand-red-border text-brand-red' : 'bg-surface-base border-surface-border text-text-secondary hover:border-brand-red/30'}`}>
                      {s.user.name}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-surface-border text-text-muted text-xs py-2.5 rounded-lg">Cancelar</button>
              <button type="submit" disabled={saving} className="flex-1 bg-brand-red text-white text-xs font-medium py-2.5 rounded-lg disabled:opacity-50">
                {saving ? 'Salvando...' : 'Criar aula'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lesson list */}
      {loading ? (
        <div className="text-text-muted text-sm">Carregando...</div>
      ) : dayLessons.length === 0 ? (
        <div className="text-text-muted text-sm">Nenhuma aula neste dia.</div>
      ) : (
        <div className="space-y-2">
          {dayLessons.map(lesson => {
            const expanded = expandedId === lesson.id
            const enrolledIds = lesson.students.map(ls => ls.student.id)
            const available = allStudents.filter(s => !enrolledIds.includes(s.id))
            return (
              <div key={lesson.id} className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
                <button className="w-full text-left px-4 py-3 flex items-center gap-3" onClick={() => setExpandedId(expanded ? null : lesson.id)}>
                  <div className="text-sm font-medium text-brand-red w-12 flex-shrink-0">{lesson.time}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{lesson.title}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-sm border bg-surface-elevated border-surface-border text-text-muted">
                        {lesson.type === 'INDIVIDUAL' ? 'INDIVIDUAL' : `TURMA · ${lesson.students.length}`}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border ${STATUS_STYLES[lesson.status]}`}>
                        {STATUS_LABELS[lesson.status]}
                      </span>
                    </div>
                  </div>
                  <span className="text-text-muted text-xs">{expanded ? '▲' : '▼'}</span>
                </button>

                {expanded && (
                  <div className="border-t border-surface-border px-4 py-3 space-y-3">
                    {/* Students */}
                    {lesson.students.length > 0 && (
                      <div>
                        <div className="text-[9px] tracking-widest text-text-hint mb-1.5">ALUNOS</div>
                        <div className="space-y-1">
                          {lesson.students.map(ls => (
                            <div key={ls.student.id} className="flex items-center justify-between bg-surface-base border border-surface-border rounded-lg px-3 py-2">
                              <span className="text-xs">{ls.student.user.name}</span>
                              {lesson.type === 'GROUP' && (
                                <button onClick={() => handleRemoveStudent(lesson.id, ls.student.id)} className="text-brand-red text-xs hover:opacity-70">✕</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add students (GROUP only) */}
                    {lesson.type === 'GROUP' && available.length > 0 && (
                      <div>
                        <div className="text-[9px] tracking-widest text-text-hint mb-1.5">ADICIONAR ALUNO</div>
                        <div className="max-h-28 overflow-y-auto space-y-1">
                          {available.map(s => (
                            <button key={s.id} onClick={() => handleAddStudent(lesson.id, s.id)}
                              className="w-full text-left px-3 py-2 rounded-lg border border-surface-border bg-surface-base text-xs text-text-secondary hover:border-brand-red/40 hover:text-text-primary transition-colors">
                              + {s.user.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {lesson.status !== 'CONFIRMED' && (
                        <button onClick={() => handleStatusChange(lesson.id, 'CONFIRMED')}
                          className="flex-1 text-xs py-2 rounded-lg bg-state-mastered-bg border border-state-mastered-border text-state-mastered">
                          Confirmar
                        </button>
                      )}
                      {lesson.status !== 'CANCELLED' && (
                        <button onClick={() => handleStatusChange(lesson.id, 'CANCELLED')}
                          className="flex-1 text-xs py-2 rounded-lg bg-brand-red-dim border border-brand-red-border text-brand-red">
                          Cancelar
                        </button>
                      )}
                      <button onClick={() => handleDelete(lesson.id)}
                        className="px-3 text-xs py-2 rounded-lg border border-surface-border text-text-hint hover:text-brand-red">
                        🗑
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
