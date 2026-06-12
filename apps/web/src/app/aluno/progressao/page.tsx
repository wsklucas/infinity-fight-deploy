'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '../../../store/auth'
import { getMyStudent, getStudentProgress } from '../../../lib/api'

const LEVEL_LABELS: Record<number, string> = {
  1: 'Fundamentos', 2: 'Técnico', 3: 'Tático', 4: 'Competidor'
}
const LEVEL_ICONS: Record<number, string> = {
  1: '🥉', 2: '🥈', 3: '🥇', 4: '🏆'
}

export default function ProgressaoPage() {
  const { user } = useAuth()
  const [sublevels, setSublevels] = useState<any[]>([])
  const [current, setCurrent] = useState('')
  const [open, setOpen] = useState<Record<number, boolean>>({ 1: false, 2: true, 3: false, 4: false })

  useEffect(() => {
    if (!user) return
    // Get Student ID from /students/me (user.id alone is the User ID, not Student ID)
    getMyStudent()
      .then(d => getStudentProgress(d.student.id))
      .then(d => {
        setSublevels(d.sublevels)
        setCurrent(d.current_sublevel)
      })
  }, [user])

  const byLevel = [1, 2, 3, 4].map(l => ({
    level: l,
    subs: sublevels.filter(s => s.level === l),
  }))

  const completed = sublevels.filter(s => s.state === 'completed').length
  const total = sublevels.length
  const overall = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div>
      <div className="text-[9px] tracking-widest text-brand-red mb-1">SUA JORNADA</div>
      <div className="text-xl font-medium mb-1">Mapa de progressão</div>
      <div className="text-xs text-text-muted mb-5">4 níveis · 12 subníveis</div>

      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-text-muted">Progressão geral</span>
          <span className="text-brand-red font-medium">{overall}%</span>
        </div>
        <div className="h-1.5 bg-surface-border rounded-full">
          <div className="h-full rounded-full bg-brand-red transition-all" style={{ width: `${overall}%` }} />
        </div>
        <div className="text-[10px] text-text-muted mt-1">{completed} de {total} subníveis concluídos</div>
      </div>

      <div className="space-y-2.5">
        {byLevel.map(({ level, subs }) => {
          const levelPct = subs.length > 0
            ? Math.round(subs.filter(s => s.state === 'completed').length / subs.length * 100)
            : 0
          const isOpen = open[level]

          return (
            <div key={level} className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(o => ({ ...o, [level]: !o[level] }))}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: levelPct === 100 ? '#081A08' : '#1A0808' }}>
                    {LEVEL_ICONS[level]}
                  </div>
                  <div>
                    <div className="text-sm font-medium">Nível {level} — {LEVEL_LABELS[level]}</div>
                    <div className="text-[10px] text-text-muted">{subs.length} subníveis</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${levelPct === 100 ? 'text-state-mastered' : levelPct > 0 ? 'text-brand-red' : 'text-text-hint'}`}>
                    {levelPct}%
                  </span>
                  <span className="text-text-muted text-xs" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>›</span>
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-3 border-t border-surface-border pt-3">
                  {subs.map((sub: any) => (
                    <div key={sub.id} className="flex items-center gap-3 py-2 border-b border-surface-border/50 last:border-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sub.state === 'completed' ? 'bg-state-mastered' : sub.state === 'active' ? 'bg-brand-red' : 'bg-surface-border'}`} />
                      <div className="flex-1 text-xs">{sub.id} · {sub.label}</div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border ${
                        sub.state === 'completed' ? 'bg-state-mastered-bg text-state-mastered border-state-mastered-border' :
                        sub.state === 'active' ? 'bg-brand-red-dim text-brand-red border-brand-red-border' :
                        'bg-surface-base text-text-hint border-surface-border'
                      }`}>
                        {sub.state === 'completed' ? 'Concluído' : sub.state === 'active' ? `Em curso · ${sub.progress}%` : 'Bloqueado'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
