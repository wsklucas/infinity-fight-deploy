'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getStudents, getSublevels, submitIntakeAssessment } from '../../../lib/api'

/* ── Types ─────────────────────────────────────────────────────────────────── */

type Step = 1 | 2 | 3
type EvalState = 'MASTERED' | 'DEVELOPING' | 'NOT_STARTED'
type Results = Record<string, Record<string, EvalState | null>>

interface StudentItem {
  id: string
  currentSublevel: string
  user: { name: string; email: string }
}

interface Criterion {
  id: string
  type: 'BLOCKER' | 'COMPLEMENTARY'
  text: string
  context?: string
  minimumValue?: number
}

interface Sublevel {
  id: string
  level: number
  label: string
  description: string
  criteria: Criterion[]
}

/* ── Constants ──────────────────────────────────────────────────────────────── */

const ALL_SUBLEVELS = ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C']

const BLOCK_INFO: Record<string, { num: number; name: string }> = {
  '1A': { num: 1, name: 'Postura e primeiros golpes' },
  '1B': { num: 2, name: 'Combinações e defesas básicas' },
  '1C': { num: 2, name: 'Combinações e defesas básicas' },
  '2A': { num: 3, name: 'Movimentação e contra-ataque' },
  '2B': { num: 3, name: 'Movimentação e contra-ataque' },
  '2C': { num: 4, name: 'Clínch e fintas' },
  '3A': { num: 5, name: 'Leitura tática avançada' },
  '3B': { num: 5, name: 'Leitura tática avançada' },
  '3C': { num: 6, name: 'Psicologia e adaptação' },
}

const DURATION_OPTIONS = [
  { value: 'lt6', label: 'Menos de 6 meses' },
  { value: '6to12', label: '6 meses a 1 ano' },
  { value: '1to2', label: '1 a 2 anos' },
  { value: 'gt2', label: 'Mais de 2 anos' },
]

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function getSuggestedStart(hasTrained: boolean, duration: string | null): string {
  if (!hasTrained || !duration) return '1A'
  const map: Record<string, string> = { lt6: '1A', '6to12': '1B', '1to2': '2A', gt2: '2C' }
  return map[duration] ?? '1A'
}

function checkStop(res: Record<string, EvalState | null>, criteria: Criterion[]): boolean {
  const blockerNS = criteria.some(c => c.type === 'BLOCKER' && res[c.id] === 'NOT_STARTED')
  const compNS = criteria.filter(c => c.type === 'COMPLEMENTARY' && res[c.id] === 'NOT_STARTED').length
  return blockerNS || compNS >= 3
}

function isComplete(res: Record<string, EvalState | null>, criteria: Criterion[]): boolean {
  return criteria.length > 0 && criteria.every(c => res[c.id] != null)
}

/* ── Main page ──────────────────────────────────────────────────────────────── */

export default function IngressoPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [students, setStudents] = useState<StudentItem[]>([])
  const [sublevels, setSublevels] = useState<Sublevel[]>([])
  const [loading, setLoading] = useState(true)

  // Step 1
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [hasTrained, setHasTrained] = useState<boolean | null>(null)
  const [duration, setDuration] = useState<string | null>(null)

  // Step 2
  const [evalOrder, setEvalOrder] = useState<string[]>([])
  const [evalIdx, setEvalIdx] = useState(0)
  const [results, setResults] = useState<Results>({})
  const [stoppedAt, setStoppedAt] = useState<string | null>(null)

  // Step 3
  const [focusNotes, setFocusNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      getStudents().then(d => setStudents(d.students ?? [])),
      getSublevels().then(d => setSublevels(d.sublevels ?? [])),
    ]).finally(() => setLoading(false))
  }, [])

  const sublevelMap = Object.fromEntries(sublevels.map(s => [s.id, s]))
  const suggestedStart = hasTrained !== null ? getSuggestedStart(hasTrained, duration) : '1A'
  const evalStopped = stoppedAt !== null

  // Step 2 derived
  const currentSublevelId = evalOrder[evalIdx] ?? ''
  const currentSublevel = sublevelMap[currentSublevelId]
  const currentResults = results[currentSublevelId] ?? {}
  const isCurrStopped = currentSublevel ? checkStop(currentResults, currentSublevel.criteria) : false
  const isCurrComplete = currentSublevel ? isComplete(currentResults, currentSublevel.criteria) : false

  // Step 3 derived
  const resultSublevel = stoppedAt ?? '1A'
  const allStates = Object.values(results).flatMap(r => Object.values(r)).filter((s): s is EvalState => s !== null)
  const totalMastered = allStates.filter(s => s === 'MASTERED').length
  const totalDeveloping = allStates.filter(s => s === 'DEVELOPING').length
  const totalNotStarted = allStates.filter(s => s === 'NOT_STARTED').length

  const startEval = () => {
    const idx = ALL_SUBLEVELS.indexOf(suggestedStart)
    setEvalOrder(ALL_SUBLEVELS.slice(idx))
    setEvalIdx(0)
    setResults({})
    setStoppedAt(null)
    setFocusNotes('')
    setStep(2)
  }

  const resetAll = () => {
    setStep(1)
    setEvalIdx(0)
    setResults({})
    setStoppedAt(null)
  }

  const markCriterion = (criterionId: string, state: EvalState) => {
    if (evalStopped) return
    const newSub = { ...currentResults, [criterionId]: state }
    setResults(prev => ({ ...prev, [currentSublevelId]: newSub }))
    if (currentSublevel && checkStop(newSub, currentSublevel.criteria)) {
      setStoppedAt(currentSublevelId)
    }
  }

  const goNext = () => {
    if (evalStopped) {
      setStep(3)
    } else if (evalIdx < evalOrder.length - 1) {
      setEvalIdx(i => i + 1)
    } else {
      setStoppedAt(evalOrder[evalOrder.length - 1])
      setStep(3)
    }
  }

  const handleConfirm = async () => {
    if (!selectedStudentId) return
    setSaving(true)
    try {
      const blockResults = Object.entries(results).map(([sublevelId, subRes]) => ({
        sublevelId,
        criterionResults: Object.entries(subRes)
          .filter((entry): entry is [string, EvalState] => entry[1] !== null)
          .map(([criterionId, state]) => ({ criterionId, state })),
      }))
      await submitIntakeAssessment({
        studentId: selectedStudentId,
        triageData: { hasTrained, duration, suggestedStart },
        blockResults,
        focusNotes,
      })
      router.push('/instrutor')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-text-muted text-sm mt-4">Carregando...</div>

  return (
    <div>
      <div className="text-[9px] tracking-widest text-brand-red mb-1">AVALIAÇÃO</div>
      <div className="text-xl font-medium mb-1">Ingresso</div>
      <div className="text-xs text-text-muted mb-5">Posicione o novo aluno no subnível correto</div>

      <StepIndicator step={step} />

      {/* ── STEP 1 — Triagem ── */}
      {step === 1 && (
        <div className="space-y-4 mt-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <div className="text-[9px] tracking-widest text-text-hint mb-3">ALUNO</div>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-brand-red"
            >
              <option value="">Selecione o aluno...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.user.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-xl p-4 space-y-4">
            <div className="text-[9px] tracking-widest text-text-hint">TRIAGEM</div>

            <div>
              <p className="text-sm font-medium mb-2">Já praticou alguma arte marcial antes?</p>
              <div className="flex gap-2">
                {([{ val: true, label: 'Sim' }, { val: false, label: 'Não' }] as const).map(opt => (
                  <button
                    key={String(opt.val)}
                    onClick={() => { setHasTrained(opt.val); if (!opt.val) setDuration(null) }}
                    className={`flex-1 py-2.5 text-xs font-medium rounded-lg border transition-colors ${
                      hasTrained === opt.val
                        ? 'bg-brand-red text-white border-brand-red'
                        : 'bg-surface-base border-surface-border text-text-secondary hover:border-brand-red'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {hasTrained === true && (
              <div>
                <p className="text-sm font-medium mb-2">Por quanto tempo?</p>
                <div className="grid grid-cols-2 gap-2">
                  {DURATION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setDuration(opt.value)}
                      className={`py-2.5 px-3 text-xs rounded-lg border transition-colors text-left ${
                        duration === opt.value
                          ? 'bg-brand-red text-white border-brand-red'
                          : 'bg-surface-base border-surface-border text-text-secondary hover:border-brand-red'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {hasTrained !== null && (hasTrained === false || duration !== null) && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-4">
              <div className="text-[9px] tracking-widest text-text-hint mb-2">SUGESTÃO DE ENTRADA</div>
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-brand-red-dim border border-brand-red-border text-sm font-medium text-brand-red">
                  {suggestedStart}
                </span>
                <div>
                  <p className="text-sm font-medium">
                    Bloco {BLOCK_INFO[suggestedStart]?.num} — {BLOCK_INFO[suggestedStart]?.name}
                  </p>
                  <p className="text-xs text-text-muted">A avaliação prática iniciará neste subnível</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={startEval}
            disabled={!selectedStudentId || hasTrained === null || (hasTrained === true && !duration)}
            className="w-full bg-brand-red text-white text-sm font-medium py-3 rounded-xl disabled:opacity-40 transition-opacity"
          >
            Iniciar avaliação prática →
          </button>
        </div>
      )}

      {/* ── STEP 2 — Avaliação prática ── */}
      {step === 2 && currentSublevel && (
        <div className="space-y-3 mt-4">
          {/* Header */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[9px] tracking-widest text-text-hint">
                  BLOCO {BLOCK_INFO[currentSublevelId]?.num} · {BLOCK_INFO[currentSublevelId]?.name}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="w-7 h-7 flex items-center justify-center rounded-md bg-brand-red-dim border border-brand-red-border text-[11px] font-medium text-brand-red">
                    {currentSublevelId}
                  </span>
                  <span className="text-sm font-medium">{currentSublevel.label}</span>
                </div>
              </div>
              <span className="text-[10px] text-text-hint flex-shrink-0 mt-1">
                {evalIdx + 1} / {evalOrder.length}
              </span>
            </div>
            <div className="h-1 bg-surface-border rounded-full overflow-hidden">
              <div
                className="h-1 bg-brand-red rounded-full transition-all"
                style={{ width: `${(evalIdx / Math.max(evalOrder.length - 1, 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Criteria */}
          <div className="space-y-2">
            {currentSublevel.criteria.map(c => {
              const state = currentResults[c.id] ?? null
              const isNSComp = c.type === 'COMPLEMENTARY' && state === 'NOT_STARTED'
              return (
                <div
                  key={c.id}
                  className={`bg-surface-card border rounded-xl p-3.5 transition-colors ${
                    (c.type === 'BLOCKER' && state === 'NOT_STARTED') || isNSComp
                      ? 'border-brand-red-border'
                      : 'border-surface-border'
                  }`}
                >
                  <div className="flex gap-2 items-start mb-3">
                    <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-sm border flex-shrink-0 mt-0.5 ${
                      c.type === 'BLOCKER'
                        ? 'bg-brand-red-dim text-brand-red border-brand-red-border'
                        : 'bg-state-developing-bg text-state-developing border-state-developing-border'
                    }`}>
                      {c.type === 'BLOCKER' ? 'BLOQ' : 'COMP'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-secondary leading-relaxed">{c.text}</p>
                      {c.context && (
                        <p className="text-[10px] text-text-hint mt-0.5 leading-relaxed">{c.context}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 ml-6">
                    {([
                      { val: 'MASTERED', label: 'Dominado', on: 'bg-state-mastered-bg text-state-mastered border-state-mastered-border', off: 'bg-surface-base border-surface-border text-text-hint' },
                      { val: 'DEVELOPING', label: 'Em desenv.', on: 'bg-state-developing-bg text-state-developing border-state-developing-border', off: 'bg-surface-base border-surface-border text-text-hint' },
                      { val: 'NOT_STARTED', label: 'Não iniciado', on: 'bg-brand-red-dim text-brand-red border-brand-red-border', off: 'bg-surface-base border-surface-border text-text-hint' },
                    ] as const).map(btn => (
                      <button
                        key={btn.val}
                        onClick={() => markCriterion(c.id, btn.val)}
                        disabled={evalStopped}
                        className={`flex-1 text-[10px] font-medium py-1.5 rounded-lg border transition-colors disabled:cursor-default ${
                          state === btn.val ? btn.on : btn.off + ' hover:border-surface-elevated'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Stop counter warning */}
          {!evalStopped && (() => {
            const compNS = currentSublevel.criteria.filter(
              c => c.type === 'COMPLEMENTARY' && currentResults[c.id] === 'NOT_STARTED'
            ).length
            return compNS > 0 && compNS < 3 ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-elevated border border-surface-border">
                <span className="text-[10px] text-text-muted">
                  ⚠ Complementares não iniciados: <span className="font-medium text-text-primary">{compNS}/3</span> (encerra em 3)
                </span>
              </div>
            ) : null
          })()}

          {/* Stop banner */}
          {isCurrStopped && (
            <div className="bg-brand-red-dim border border-brand-red-border rounded-xl p-4">
              <div className="flex gap-2 items-start">
                <span className="text-brand-red text-base flex-shrink-0">⊗</span>
                <div>
                  <p className="text-sm font-medium text-brand-red">Avaliação encerrada</p>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    {currentSublevel.criteria.some(c => c.type === 'BLOCKER' && currentResults[c.id] === 'NOT_STARTED')
                      ? 'Critério bloqueador não iniciado. '
                      : '3 critérios complementares não iniciados. '}
                    O aluno ingressará no subnível{' '}
                    <span className="font-semibold text-text-primary">{currentSublevelId}</span>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="flex gap-2">
            <button
              onClick={resetAll}
              className="border border-surface-border text-text-muted text-xs py-2.5 px-4 rounded-xl"
            >
              ← Reiniciar
            </button>
            <button
              onClick={goNext}
              disabled={!evalStopped && !isCurrComplete}
              className={`flex-1 text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-40 ${
                evalStopped
                  ? 'bg-brand-red text-white'
                  : 'bg-surface-elevated border border-surface-border text-text-primary'
              }`}
            >
              {evalStopped || (isCurrComplete && evalIdx === evalOrder.length - 1)
                ? 'Ver resultado →'
                : 'Próximo subnível →'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 — Resultado ── */}
      {step === 3 && (
        <div className="space-y-4 mt-4">
          {/* Result */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 text-center">
            <div className="text-[9px] tracking-widest text-text-hint mb-3">SUBNÍVEL DE INGRESSO</div>
            <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-xl bg-brand-red-dim border-2 border-brand-red text-xl font-bold text-brand-red mb-3">
              {resultSublevel}
            </div>
            <p className="text-sm font-medium">{sublevelMap[resultSublevel]?.label}</p>
            <p className="text-xs text-text-muted mt-1">
              Bloco {BLOCK_INFO[resultSublevel]?.num} · {BLOCK_INFO[resultSublevel]?.name}
            </p>
          </div>

          {/* Counters */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard value={totalMastered} label="DOMINADOS" color="text-state-mastered" />
            <StatCard value={totalDeveloping} label="EM DESENV." color="text-state-developing" />
            <StatCard value={totalNotStarted} label="NÃO INIC." color="text-brand-red" />
          </div>

          {/* Focus notes */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-4">
            <div className="text-[9px] tracking-widest text-text-hint mb-2">PLANO DE FOCO — PRIMEIRAS AULAS</div>
            <textarea
              value={focusNotes}
              onChange={e => setFocusNotes(e.target.value)}
              placeholder="Descreva os pontos principais de foco para as primeiras aulas deste aluno..."
              rows={4}
              className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2.5 text-xs text-text-primary placeholder:text-text-hint resize-none focus:outline-none focus:border-brand-red"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="border border-surface-border text-text-muted text-xs py-3 px-4 rounded-xl"
            >
              ← Revisar
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="flex-1 bg-brand-red text-white text-sm font-medium py-3 rounded-xl disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Confirmar ingresso'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function StepIndicator({ step }: { step: Step }) {
  const steps: { num: Step; label: string }[] = [
    { num: 1, label: 'Triagem' },
    { num: 2, label: 'Avaliação' },
    { num: 3, label: 'Resultado' },
  ]
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-1 flex-1">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0 ${
            step >= s.num ? 'bg-brand-red text-white' : 'bg-surface-base border border-surface-border text-text-muted'
          }`}>
            {s.num}
          </div>
          <span className={`text-[9px] tracking-wide whitespace-nowrap ${
            step >= s.num ? 'text-text-primary' : 'text-text-hint'
          }`}>
            {s.label}
          </span>
          {i < steps.length - 1 && <div className="flex-1 h-px bg-surface-border mx-1" />}
        </div>
      ))}
    </div>
  )
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-3 text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[9px] tracking-widest text-text-hint mt-0.5">{label}</div>
    </div>
  )
}
