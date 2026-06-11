'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getStudent, getCurrentProgress, sendFeedback, updateStudentStatus, resetStudentPassword } from '../../../../lib/api'
import { useAuth } from '../../../../store/auth'

export default function StudentProfile({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const isAdmin = authUser?.role === 'ADMIN'
  const [student, setStudent] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)
  const [feedback, setFeedback] = useState('')
  const [sending, setSending] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [resetModal, setResetModal] = useState<string | null>(null)

  useEffect(() => {
    getStudent(params.id).then(d => setStudent(d))
    getCurrentProgress(params.id).then(d => setProgress(d))
  }, [params.id])

  const handleToggleStatus = async () => {
    const isActive = s.user.active !== false
    const msg = isActive
      ? `Inativar ${s.user.name}? O aluno não aparecerá na lista principal.`
      : `Reativar ${s.user.name}?`
    if (!window.confirm(msg)) return
    setTogglingStatus(true)
    await updateStudentStatus(params.id, !isActive)
    await getStudent(params.id).then(d => setStudent(d))
    setTogglingStatus(false)
  }

  const handleFeedback = async () => {
    if (!feedback.trim()) return
    setSending(true)
    await sendFeedback(params.id, feedback)
    setFeedback('')
    setSending(false)
    getStudent(params.id).then(d => setStudent(d))
  }

  const handleResetPassword = async () => {
    if (!window.confirm(`Resetar senha de ${student?.student?.user?.name}? Uma senha temporária será gerada.`)) return
    try {
      const data = await resetStudentPassword(params.id)
      setResetModal(data.temp_password)
    } catch {
      alert('Erro ao resetar senha')
    }
  }

  if (!student) return <div className="text-text-muted text-sm">Carregando...</div>

  const s = student.student
  const pct = progress?.progress ?? 0

  return (
    <div>
      <button onClick={() => router.back()} className="text-xs text-text-muted hover:text-brand-red mb-4 flex items-center gap-1">← voltar</button>

      <div className="bg-surface-card border border-surface-border border-t-2 border-t-brand-red rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-brand-red-dim border border-brand-red-border flex items-center justify-center text-base font-medium text-brand-red flex-shrink-0">
            {s.user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="font-medium">{s.user.name}</div>
              {s.user.active === false && (
                <span className="text-[9px] font-medium px-2 py-0.5 rounded-sm tracking-wider bg-brand-red-dim text-brand-red border border-brand-red-border">INATIVO</span>
              )}
            </div>
            <div className="text-xs text-text-muted">{s.trainingDays} treinos · desde {new Date(s.createdAt ?? Date.now()).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</div>
            <div className="flex gap-1 mt-1 flex-wrap">
              {s.styleTags?.map((tag: string) => (
                <span key={tag} className="text-[9px] px-2 py-0.5 bg-surface-elevated border border-surface-border rounded-sm text-text-muted">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { val: s.currentSublevel, label: 'SUBNÍVEL' },
            { val: `${pct}%`, label: 'CRITÉRIOS OK' },
            { val: `${s.currentStreak}d`, label: 'STREAK' },
          ].map(({ val, label }) => (
            <div key={label} className="bg-surface-base border border-surface-border rounded-lg p-2.5 text-center">
              <div className="text-lg font-medium text-brand-red">{val}</div>
              <div className="text-[9px] text-text-muted tracking-wider mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-xl p-3.5 mb-4">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-xs font-medium">Subnível {s.currentSublevel}</span>
          <span className="text-sm font-medium text-brand-red">{pct}%</span>
        </div>
        <div className="h-1.5 bg-surface-border rounded-full mb-2.5">
          <div className="h-full rounded-full bg-brand-red transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {progress?.criteria_states && (
        <div className="mb-4">
          <div className="text-[9px] tracking-widest text-text-muted mb-2">CRITÉRIOS ATIVOS</div>
          <div className="space-y-1.5">
            {progress.criteria_states.map((c: any) => (
              <div key={c.id} className="flex items-center gap-2 bg-surface-card border border-surface-border rounded-lg p-2.5">
                <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-sm flex-shrink-0 ${c.type === 'BLOCKER' ? 'bg-state-not-started-bg text-state-not-started border border-state-not-started-border' : 'bg-state-developing-bg text-state-developing border border-state-developing-border'}`}>
                  {c.type === 'BLOCKER' ? 'BLOQ' : 'COMP'}
                </span>
                <span className="flex-1 text-xs text-text-secondary">{c.text}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-sm flex-shrink-0 ${
                  c.state === 'MASTERED' ? 'bg-state-mastered-bg text-state-mastered border border-state-mastered-border' :
                  c.state === 'DEVELOPING' ? 'bg-state-developing-bg text-state-developing border border-state-developing-border' :
                  'bg-surface-border text-text-hint border border-surface-border'
                }`}>
                  {c.state === 'MASTERED' ? 'Dominado' : c.state === 'DEVELOPING' ? 'Em desenv.' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <Link href={`/instrutor/avaliar?student=${params.id}&sublevel=${s.currentSublevel}`} className="flex-1 bg-brand-red text-white text-xs font-medium py-2.5 rounded-lg text-center">
          Avaliar agora
        </Link>
        <button className="flex-1 bg-surface-card border border-surface-border text-text-muted text-xs py-2.5 rounded-lg">
          Ver histórico
        </button>
      </div>

      <button
        onClick={handleToggleStatus}
        disabled={togglingStatus}
        className={`w-full text-xs font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 ${
          s.user.active === false
            ? 'bg-state-mastered-bg border border-state-mastered-border text-state-mastered hover:opacity-80'
            : 'bg-surface-card border border-surface-border text-brand-red hover:bg-brand-red-dim'
        }`}
      >
        {togglingStatus ? 'Aguarde...' : s.user.active === false ? 'Reativar aluno' : 'Inativar aluno'}
      </button>

      {isAdmin && (
        <button
          onClick={handleResetPassword}
          className="w-full mt-2 mb-5 text-xs font-medium py-2.5 rounded-lg bg-surface-card border border-surface-border text-text-muted hover:text-text-primary transition-colors"
        >
          Resetar senha
        </button>
      )}

      {resetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-6 max-w-sm w-full">
            <div className="text-xs font-medium tracking-widest text-state-mastered mb-3">SENHA RESETADA</div>
            <p className="text-xs text-text-secondary mb-3">
              Repasse esta senha temporária ao aluno. Ele precisará trocá-la no primeiro acesso.
            </p>
            <div className="bg-surface-base border border-surface-border rounded-lg px-4 py-3 mb-4 flex items-center justify-between gap-3">
              <span className="text-base font-mono font-medium text-text-primary">{resetModal}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(resetModal); }}
                className="text-[10px] text-brand-red hover:underline flex-shrink-0"
              >
                Copiar
              </button>
            </div>
            <button
              onClick={() => setResetModal(null)}
              className="w-full bg-brand-red text-white text-xs font-medium py-2.5 rounded-lg hover:bg-brand-red-dark transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {student.last_feedback && (
        <div className="bg-state-mastered-bg border border-state-mastered-border rounded-xl p-3.5 mb-4">
          <div className="text-xs font-medium text-state-mastered mb-1">Último feedback</div>
          <div className="text-xs text-green-300 leading-relaxed">"{student.last_feedback.text}"</div>
        </div>
      )}

      <div>
        <div className="text-[9px] tracking-widest text-text-muted mb-2">ENVIAR FEEDBACK</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          placeholder="Escreva um feedback para o aluno..."
          className="w-full bg-surface-card border border-surface-border rounded-lg p-3 text-xs text-text-primary resize-none h-20 mb-2 focus:outline-none focus:border-brand-red/50"
        />
        <button
          onClick={handleFeedback}
          disabled={sending || !feedback.trim()}
          className="w-full bg-brand-red hover:bg-brand-red-dark disabled:opacity-40 text-white text-xs font-medium py-2.5 rounded-lg transition-colors"
        >
          {sending ? 'Enviando...' : 'Enviar feedback'}
        </button>
      </div>
    </div>
  )
}
