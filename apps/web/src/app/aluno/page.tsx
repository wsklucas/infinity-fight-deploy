'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '../../store/auth'
import { getMyStudent, getCurrentProgress, checkin as doCheckin } from '../../lib/api'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [student, setStudent] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)
  const [checkedIn, setCheckedIn] = useState(false)
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    // Step 1: get student record (by userId from JWT via /students/me)
    getMyStudent()
      .then(d => {
        setStudent(d)
        // Step 2: use the Student ID (not User ID) for progress
        return getCurrentProgress(d.student.id)
      })
      .then(d => setProgress(d))
      .finally(() => setLoading(false))
  }, [user])

  const handleCheckin = async () => {
    try {
      const res = await doCheckin()
      setCheckedIn(true)
      setStreak(res.streak)
    } catch {
      setCheckedIn(true)
    }
  }

  if (loading) return <div className="text-text-muted text-sm">Carregando...</div>

  const s = student?.student
  const pct = progress?.progress ?? 0
  const sub = progress?.sublevel

  return (
    <div>
      <div className="text-[9px] tracking-widest text-brand-red mb-1">
        BOM DIA, {s?.user.name.split(' ')[0].toUpperCase()}
      </div>
      <div className="text-xl font-medium mb-1">Seu progresso</div>
      <div className="text-xs text-text-muted mb-5">Subnível {s?.currentSublevel} · {sub?.label}</div>

      <div className="bg-surface-card border border-surface-border border-t-2 border-t-brand-red rounded-xl p-4 mb-3">
        <div className="text-[9px] tracking-widest text-text-muted mb-1">NÍVEL {sub?.level} · {getLevelName(sub?.level)}</div>
        <div className="text-xl font-medium mb-0.5">Subnível {s?.currentSublevel}</div>
        <div className="text-xs text-text-muted mb-4">{sub?.description}</div>

        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 64 64" className="w-full h-full">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#1E1E1E" strokeWidth="5"/>
              <circle cx="32" cy="32" r="26" fill="none" stroke="#C0392B" strokeWidth="5"
                strokeDasharray={`${Math.round(163 * pct / 100)} ${Math.round(163 * (1 - pct / 100))}`}
                strokeDashoffset="41" transform="rotate(-90 32 32)"/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-brand-red">{pct}%</div>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-medium text-brand-red">{pct}%</div>
            <div className="text-xs text-text-muted">critérios aprovados</div>
            <div className="flex gap-2 mt-2">
              {[
                { val: progress?.criteria_states?.filter((c: any) => c.state === 'MASTERED').length ?? 0, label: 'DOM', color: 'text-state-mastered' },
                { val: progress?.criteria_states?.filter((c: any) => c.state === 'DEVELOPING').length ?? 0, label: 'DEV', color: 'text-state-developing' },
                { val: progress?.criteria_states?.filter((c: any) => !c.state).length ?? 0, label: 'PEND', color: 'text-text-hint' },
              ].map(({ val, label, color }) => (
                <div key={label} className="bg-surface-base border border-surface-border rounded-md px-2 py-1 text-center">
                  <div className={`text-sm font-medium ${color}`}>{val}</div>
                  <div className="text-[8px] text-text-muted">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-surface-card border border-surface-border rounded-xl p-3">
          <div className="text-lg font-medium text-brand-red">{s?.trainingDays ?? 0}</div>
          <div className="text-[9px] text-text-muted tracking-wider mt-0.5">TREINOS NO MÊS</div>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-xl p-3">
          <div className="text-lg font-medium text-state-mastered">{streak || (s?.currentStreak ?? 0)}</div>
          <div className="text-[9px] text-text-muted tracking-wider mt-0.5">DIAS SEGUIDOS</div>
        </div>
      </div>

      {student?.last_feedback && (
        <div className="bg-state-mastered-bg border border-state-mastered-border rounded-xl p-3.5 mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-state-mastered" />
            <div className="text-xs font-medium text-state-mastered">
              Feedback · {new Date(student.last_feedback.createdAt).toLocaleDateString('pt-BR')}
            </div>
          </div>
          <div className="text-xs text-green-300 leading-relaxed">"{student.last_feedback.text}"</div>
        </div>
      )}

      <div className="bg-surface-card border border-surface-border border-t-2 border-t-brand-red rounded-xl p-4">
        <div className="text-sm font-medium mb-0.5">Treinou hoje?</div>
        <div className="text-xs text-text-muted mb-4">Registre sua presença</div>
        {checkedIn ? (
          <div className="bg-state-mastered-bg border border-state-mastered-border rounded-xl p-4 text-center">
            <div className="text-sm font-medium text-state-mastered mb-1">Treino registrado</div>
            <div className="text-xs text-text-muted">{streak} dias seguidos</div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleCheckin} className="flex-1 bg-brand-red text-white text-xs font-medium py-3 rounded-lg">Sim, treinei</button>
            <button className="flex-1 bg-surface-elevated border border-surface-border text-text-muted text-xs py-3 rounded-lg">Não treinei</button>
          </div>
        )}
      </div>
    </div>
  )
}

function getLevelName(level?: number): string {
  return ['', 'FUNDAMENTOS', 'TÉCNICO', 'TÁTICO', 'COMPETIDOR'][level ?? 0] ?? ''
}
