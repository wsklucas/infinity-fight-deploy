'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createEvaluation, updateEvaluationItems, confirmAdvance, getSublevel } from '../../../lib/api'
import { useAuth } from '../../../store/auth'

type State = 'MASTERED' | 'DEVELOPING' | 'NOT_STARTED'

function EvaluationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const studentId = searchParams.get('student') ?? ''
  const sublevelId = searchParams.get('sublevel') ?? ''

  const [evalId, setEvalId] = useState<string | null>(null)
  const [criteria, setCriteria] = useState<any[]>([])
  const [states, setStates] = useState<Record<string, State>>({})
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)

  useEffect(() => {
    async function init() {
      const [subData, evalData] = await Promise.all([
        getSublevel(sublevelId),
        createEvaluation({ student_id: studentId, sublevel_id: sublevelId, type: 'REGULAR' }),
      ])
      setCriteria(subData.sublevel.criteria)
      setEvalId(evalData.evaluation.id)
      setLoading(false)
    }
    if (studentId && sublevelId) init()
  }, [studentId, sublevelId])

  const setItemState = async (criterionId: string, state: State) => {
    const newStates = { ...states, [criterionId]: state }
    setStates(newStates)

    if (!evalId) return
    const items = Object.entries(newStates).map(([criterion_id, st]) => ({ criterion_id, state: st }))
    const res = await updateEvaluationItems(evalId, items)
    setResult(res)
  }

  const handleAdvance = async () => {
    if (!evalId) return
    setAdvancing(true)
    await confirmAdvance(evalId)
    router.push(`/instrutor/alunos/${studentId}?advanced=1`)
  }

  const allAnswered = criteria.length > 0 && criteria.every(c => states[c.id])
  const done = Object.keys(states).length

  if (loading) return <div className="text-text-muted text-sm">Preparando avaliação...</div>

  return (
    <div>
      <button onClick={() => router.back()} className="text-xs text-text-muted hover:text-brand-red mb-4 flex items-center gap-1">← voltar</button>

      <div className="text-[9px] tracking-widest text-brand-red mb-1">AVALIAÇÃO</div>
      <div className="text-lg font-medium mb-0.5">Subnível {sublevelId}</div>
      <div className="text-xs text-text-muted mb-4">{done}/{criteria.length} avaliados</div>

      <div className="space-y-2 mb-4">
        {criteria.map((c: any) => (
          <div key={c.id} className="bg-surface-card border border-surface-border rounded-xl p-3">
            <div className="flex items-start gap-2 mb-3">
              <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-sm flex-shrink-0 mt-0.5 ${c.type === 'BLOCKER' ? 'bg-state-not-started-bg text-state-not-started border border-state-not-started-border' : 'bg-state-developing-bg text-state-developing border border-state-developing-border'}`}>
                {c.type === 'BLOCKER' ? 'BLOQ' : 'COMP'}
              </span>
              <div className="flex-1">
                <div className="text-xs text-text-secondary leading-relaxed">{c.text}</div>
                {c.context && <div className="text-[10px] text-text-muted mt-1 italic">Contexto: {c.context}</div>}
              </div>
            </div>
            <div className="flex gap-1.5">
              {(['MASTERED','DEVELOPING','NOT_STARTED'] as State[]).map(s => (
                <button
                  key={s}
                  onClick={() => setItemState(c.id, s)}
                  className={`flex-1 py-1.5 text-[10px] font-medium rounded-md border transition-all ${
                    states[c.id] === s
                      ? s === 'MASTERED' ? 'bg-state-mastered-bg text-state-mastered border-state-mastered-border'
                        : s === 'DEVELOPING' ? 'bg-state-developing-bg text-state-developing border-state-developing-border'
                        : 'bg-state-not-started-bg text-state-not-started border-state-not-started-border'
                      : 'bg-surface-base text-text-hint border-surface-border'
                  }`}
                >
                  {s === 'MASTERED' ? 'Dominado' : s === 'DEVELOPING' ? 'Em desenv.' : 'Não iniciado'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {result && allAnswered && (
        <div className="mb-4">
          <div className={`border-l-2 rounded-r-xl p-3 mb-3 text-xs leading-relaxed ${result.can_advance ? 'bg-state-mastered-bg border-state-mastered text-green-300' : 'bg-brand-red-dim border-brand-red text-red-300'}`}>
            {result.can_advance
              ? `Bloqueadores ok · ${result.complementary_ni} complementar(es) pendente(s). Aluno apto para avançar.`
              : result.reason === 'blocker_not_started'
                ? `${result.blocker_ni} bloqueador(es) não iniciado(s). Manter no subnível atual.`
                : `${result.complementary_ni} complementares não iniciados. Manter no subnível atual.`
            }
          </div>

          <div className="bg-brand-red-dim border border-brand-red-border rounded-xl p-4 border-t-2 border-t-brand-red">
            <div className="text-sm font-medium mb-1">Liberar avanço</div>
            <div className="text-xs text-text-muted mb-3">O app calcula automaticamente quando o aluno pode avançar.</div>
            <button
              onClick={handleAdvance}
              disabled={!result.can_advance || advancing}
              className="w-full bg-brand-red hover:bg-brand-red-dark disabled:bg-surface-border disabled:text-text-hint text-white text-xs font-medium py-3 rounded-lg transition-colors"
            >
              {advancing ? 'Confirmando...' : result.can_advance ? 'Confirmar avanço' : 'Critérios insuficientes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AvaliarPage() {
  return (
    <Suspense fallback={<div className="text-text-muted text-sm">Carregando...</div>}>
      <EvaluationContent />
    </Suspense>
  )
}
