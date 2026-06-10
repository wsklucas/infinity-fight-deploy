'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getStudents } from '../../lib/api'

interface Student {
  id: string
  currentSublevel: string
  currentStreak: number
  styleTags: string[]
  user: { name: string; email: string; active: boolean }
}

export default function InstructorHome() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'active' | 'inactive'>('active')

  useEffect(() => {
    setLoading(true)
    getStudents(tab).then(d => { setStudents(d.students); setLoading(false) })
  }, [tab])

  const filtered = students.filter(s =>
    s.user.name.toLowerCase().includes(search.toLowerCase())
  )

  const needsAttention = filtered.filter(s => s.currentStreak === 0)
  const onTrack = filtered.filter(s => s.currentStreak > 0)

  return (
    <div>
      <div className="text-[9px] tracking-widest text-brand-red mb-1">VISÃO GERAL</div>
      <div className="text-xl font-medium mb-1">Seus alunos</div>
      <div className="text-xs text-text-muted mb-4">{students.length} {tab === 'active' ? 'ativos' : 'inativos'}</div>

      <div className="flex border border-surface-border rounded-lg overflow-hidden mb-4">
        {(['active', 'inactive'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === t
                ? 'bg-brand-red text-white'
                : 'bg-surface-card text-text-muted hover:text-text-secondary'
            }`}
          >
            {t === 'active' ? 'Ativos' : 'Inativos'}
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nome..."
        className="w-full bg-surface-card border-l-2 border-l-brand-red border border-surface-border rounded-r-lg px-3 py-2 text-sm mb-5 focus:outline-none"
      />

      {loading ? (
        <div className="text-text-muted text-sm">Carregando...</div>
      ) : tab === 'inactive' ? (
        filtered.length === 0 ? (
          <div className="text-text-muted text-sm">Nenhum aluno inativo.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(s => <StudentCard key={s.id} student={s} />)}
          </div>
        )
      ) : (
        <>
          {needsAttention.length > 0 && (
            <div className="mb-5">
              <SectionHead label="ATENÇÃO" />
              <div className="space-y-2">
                {needsAttention.map(s => <StudentCard key={s.id} student={s} urgent />)}
              </div>
            </div>
          )}
          {onTrack.length > 0 && (
            <div>
              <SectionHead label="EM DIA" />
              <div className="space-y-2">
                {onTrack.map(s => <StudentCard key={s.id} student={s} />)}
              </div>
            </div>
          )}
          {filtered.length === 0 && (
            <div className="text-text-muted text-sm">Nenhum aluno ativo.</div>
          )}
        </>
      )}
    </div>
  )
}

function SectionHead({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[9px] tracking-widest text-text-hint whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-surface-border" />
    </div>
  )
}

function StudentCard({ student, urgent }: { student: Student; urgent?: boolean }) {
  return (
    <Link href={`/instrutor/alunos/${student.id}`}>
      <div className={`flex items-center gap-3 bg-surface-card border rounded-xl px-4 py-3.5 cursor-pointer transition-all hover:translate-x-0.5 ${urgent ? 'border-l-2 border-l-brand-red border-surface-border' : 'border-surface-border hover:border-brand-red/30'}`}>
        <div className="relative w-10 h-10 flex-shrink-0">
          <svg className="absolute inset-0" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="17" fill="none" stroke="#1E1E1E" strokeWidth="3"/>
            <circle cx="20" cy="20" r="17" fill="none" stroke={urgent ? '#C0392B' : '#22C55E'} strokeWidth="3"
              strokeDasharray={`${Math.round(106 * 0.6)} ${Math.round(106 * 0.4)}`}
              strokeDashoffset="26" transform="rotate(-90 20 20)"/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-brand-red">
            {student.user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{student.user.name}</div>
          <div className="text-xs text-text-muted">{student.currentSublevel} · {getSublevelName(student.currentSublevel)}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[9px] font-medium px-2 py-0.5 rounded-sm tracking-wider ${urgent ? 'bg-brand-red-dim text-brand-red border border-brand-red-border' : 'bg-state-mastered-bg text-state-mastered border border-state-mastered-border'}`}>
            {urgent ? 'AVALIAR' : 'OK'}
          </span>
          <div className="text-[10px] text-text-muted">{student.currentStreak}d streak</div>
        </div>
      </div>
    </Link>
  )
}

function getSublevelName(id: string): string {
  const names: Record<string, string> = {
    '1A':'Postura e base','1B':'Chutes e combinações','1C':'Defesa ativa',
    '2A':'Movimentação','2B':'Defesas combinadas','2C':'Clínch e fintas',
    '3A':'Leitura e ângulo','3B':'Armadilhas','3C':'Psicologia',
    '4A':'Jogo próprio','4B':'Competitivo','4C':'Elite',
  }
  return names[id] ?? id
}
