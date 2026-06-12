'use client'
import { useEffect, useState } from 'react'
import {
  getPayments, createPayment, togglePayment, deletePayment,
  getExpenses, createExpense,
  getFinanceSummary, getFinanceHistory,
  getStudents,
} from '../../../lib/api'

type Tab = 'mensalidades' | 'carteira' | 'calculadora'
type PlanKey = 'MENSALIDADE' | 'AVULSA' | 'PLANO_2X' | 'PLANO_3X'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const PLAN_LABELS: Record<PlanKey, string> = {
  MENSALIDADE: 'Mensalidade',
  AVULSA: 'Avulsa',
  PLANO_2X: 'Plano 2x',
  PLANO_3X: 'Plano 3x',
}
const PLAN_DEFAULTS: Record<PlanKey, number> = {
  MENSALIDADE: 180, AVULSA: 50, PLANO_2X: 170, PLANO_3X: 160,
}
const PLAN_STYLES: Record<PlanKey, string> = {
  MENSALIDADE: 'bg-state-mastered-bg text-state-mastered border-state-mastered-border',
  AVULSA:      'bg-state-developing-bg text-state-developing border-state-developing-border',
  PLANO_2X:    'bg-surface-elevated text-text-secondary border-surface-border',
  PLANO_3X:    'bg-brand-red-dim text-brand-red border-brand-red-border',
}

function fmt(n: number) { return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function FinanceiroPage() {
  const now = new Date()
  const [tab, setTab] = useState<Tab>('mensalidades')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const navMonth = (dir: number) => {
    let m = month + dir, y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    setMonth(m); setYear(y)
  }

  const TABS: [Tab, string][] = [['mensalidades','Mensalidades'],['carteira','Carteira'],['calculadora','Calculadora']]

  return (
    <div>
      <div className="text-[9px] tracking-widest text-brand-red mb-1">FINANCEIRO</div>
      <div className="text-xl font-medium mb-4">Financeiro</div>

      <div className="flex border border-surface-border rounded-lg overflow-hidden mb-5">
        {TABS.map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === t ? 'bg-brand-red text-white' : 'bg-surface-card text-text-muted hover:text-text-secondary'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'mensalidades' && <MensalidadesTab month={month} year={year} onNav={navMonth} />}
      {tab === 'carteira'     && <CarteiraTab month={month} year={year} onNav={navMonth} />}
      {tab === 'calculadora'  && <CalculadoraTab />}
    </div>
  )
}

// ─── Mensalidades ────────────────────────────────────────────────────────────

function MensalidadesTab({ month, year, onNav }: { month: number; year: number; onNav: (d: number) => void }) {
  const [payments, setPayments] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<{ student_id: string; plan: PlanKey; amount: number }>({ student_id: '', plan: 'MENSALIDADE', amount: 180 })
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const reload = () => {
    setLoading(true)
    Promise.all([
      getPayments(month, year),
      getFinanceSummary(month, year),
      getStudents('active'),
    ]).then(([p, s, st]) => { setPayments(p.payments); setSummary(s); setStudents(st.students); setLoading(false) })
  }

  useEffect(() => { reload() }, [month, year])

  const handleToggle = async (id: string) => { await togglePayment(id); reload() }

  const handleDeletePayment = async () => {
    if (!deleteModal) return
    setDeleting(true)
    try {
      await deletePayment(deleteModal)
      setDeleteModal(null)
      reload()
    } catch {
      alert('Erro ao excluir cobrança')
    } finally {
      setDeleting(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    await createPayment({ ...form, month, year })
    setShowForm(false); setForm({ student_id: '', plan: 'MENSALIDADE', amount: 180 }); reload()
    setSaving(false)
  }

  const pct = summary ? Math.round(((summary.received) / (summary.total || 1)) * 100) : 0

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => onNav(-1)} className="text-text-muted hover:text-brand-red px-2 text-lg">←</button>
        <span className="text-sm font-medium">{MONTHS[month - 1]} {year}</span>
        <button onClick={() => onNav(1)} className="text-text-muted hover:text-brand-red px-2 text-lg">→</button>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-state-mastered-bg border border-state-mastered-border rounded-xl p-3">
              <div className="text-[9px] tracking-widest text-state-mastered mb-0.5">RECEBIDO</div>
              <div className="text-lg font-medium text-state-mastered">R$ {fmt(summary.received)}</div>
            </div>
            <div className="bg-brand-red-dim border border-brand-red-border rounded-xl p-3">
              <div className="text-[9px] tracking-widest text-brand-red mb-0.5">PENDENTE</div>
              <div className="text-lg font-medium text-brand-red">R$ {fmt(summary.pending)}</div>
            </div>
          </div>

          <div className="bg-surface-card border border-surface-border rounded-xl p-3 mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-text-muted">{summary.count.paid}/{summary.count.total} cobranças pagas</span>
              <span className="font-medium text-brand-red">{pct}%</span>
            </div>
            <div className="h-2 bg-surface-border rounded-full overflow-hidden">
              <div className="h-full bg-brand-red rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="text-[9px] tracking-widest text-text-hint">COBRANÇAS</div>
        <button onClick={() => setShowForm(f => !f)} className="text-xs text-brand-red hover:opacity-70">+ nova cobrança</button>
      </div>

      {showForm && (
        <div className="bg-surface-card border border-l-2 border-surface-border border-l-brand-red rounded-xl p-4 mb-4">
          <form onSubmit={handleCreate} className="space-y-2.5">
            <select value={form.student_id} onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))} required
              className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red text-text-primary">
              <option value="">Selecionar aluno...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.user.name}</option>)}
            </select>
            <select value={form.plan}
              onChange={e => { const p = e.target.value as PlanKey; setForm(f => ({ ...f, plan: p, amount: PLAN_DEFAULTS[p] })) }}
              className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red text-text-primary">
              {(Object.keys(PLAN_LABELS) as PlanKey[]).map(k => <option key={k} value={k}>{PLAN_LABELS[k]}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted pl-1">R$</span>
              <input type="number" value={form.amount} min={1} step={0.01}
                onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} required
                className="flex-1 bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-surface-border text-text-muted text-xs py-2.5 rounded-lg">Cancelar</button>
              <button type="submit" disabled={saving} className="flex-1 bg-brand-red text-white text-xs font-medium py-2.5 rounded-lg disabled:opacity-50">Adicionar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-text-muted text-sm">Carregando...</div>
      ) : payments.length === 0 ? (
        <div className="text-text-muted text-sm">Nenhuma cobrança este mês.</div>
      ) : (
        <div className="space-y-2">
          {payments.map(p => (
            <div key={p.id} className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.student.user.name}</div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border mt-0.5 inline-block ${PLAN_STYLES[p.plan as PlanKey]}`}>
                  {PLAN_LABELS[p.plan as PlanKey]}
                </span>
              </div>
              <div className="text-right mr-2 flex-shrink-0">
                <div className="text-sm font-medium">R$ {fmt(p.amount)}</div>
                {p.paidAt && <div className="text-[9px] text-text-muted">{new Date(p.paidAt).toLocaleDateString('pt-BR')}</div>}
              </div>
              <button onClick={() => handleToggle(p.id)}
                className={`text-[9px] font-medium px-2.5 py-1.5 rounded-lg border transition-opacity hover:opacity-70 flex-shrink-0 ${p.paid ? 'bg-state-mastered-bg text-state-mastered border-state-mastered-border' : 'bg-brand-red-dim text-brand-red border-brand-red-border'}`}>
                {p.paid ? 'PAGO' : 'PENDENTE'}
              </button>
              <button
                onClick={() => setDeleteModal(p.id)}
                title="Excluir cobrança"
                className="text-text-hint hover:text-brand-red transition-colors flex-shrink-0 p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-6 max-w-sm w-full">
            <div className="text-xs font-medium tracking-widest text-brand-red mb-3">EXCLUIR COBRANÇA</div>
            <p className="text-xs text-text-secondary mb-5">
              Tem certeza que deseja excluir esta cobrança? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                className="flex-1 border border-surface-border text-text-muted text-xs py-2.5 rounded-lg hover:text-text-primary transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletePayment}
                disabled={deleting}
                className="flex-1 bg-brand-red text-white text-xs font-medium py-2.5 rounded-lg hover:bg-brand-red-dark transition-colors disabled:opacity-50"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Carteira ────────────────────────────────────────────────────────────────

function CarteiraTab({ month, year, onNav }: { month: number; year: number; onNav: (d: number) => void }) {
  const [summary, setSummary] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [form, setForm] = useState({ description: '', amount: '' })
  const [saving, setSaving] = useState(false)

  const reload = () => {
    Promise.all([
      getFinanceSummary(month, year),
      getExpenses(month, year),
      getFinanceHistory(),
    ]).then(([s, e, h]) => { setSummary(s); setExpenses(e.expenses); setHistory(h.months) })
  }

  useEffect(() => { reload() }, [month, year])

  const handleExpense = async (ev: React.FormEvent) => {
    ev.preventDefault(); setSaving(true)
    await createExpense({ description: form.description, amount: Number(form.amount), month, year })
    setForm({ description: '', amount: '' }); reload(); setSaving(false)
  }

  const maxVal = history.length > 0 ? Math.max(1, ...history.map(m => Math.max(m.received, m.expenses))) : 1

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => onNav(-1)} className="text-text-muted hover:text-brand-red px-2 text-lg">←</button>
        <span className="text-sm font-medium">{MONTHS[month - 1]} {year}</span>
        <button onClick={() => onNav(1)} className="text-text-muted hover:text-brand-red px-2 text-lg">→</button>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'RECEITA', val: summary.received, color: 'text-state-mastered' },
            { label: 'DESPESAS', val: summary.expenses, color: 'text-brand-red' },
            { label: 'LÍQUIDO', val: summary.net, color: summary.net >= 0 ? 'text-state-mastered' : 'text-brand-red' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-surface-card border border-surface-border rounded-xl p-3 text-center">
              <div className="text-[9px] tracking-widest text-text-hint mb-0.5">{label}</div>
              <div className={`text-base font-medium ${color}`}>R$ {fmt(val)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bar chart */}
      {history.length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-4">
          <div className="text-[9px] tracking-widest text-text-hint mb-3">ÚLTIMOS 6 MESES</div>
          <div className="flex items-end gap-1.5 h-20">
            {history.map(m => (
              <div key={`${m.year}-${m.month}`} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex items-end gap-0.5 h-16">
                  <div className="flex-1 bg-state-mastered rounded-t transition-all min-h-[2px]"
                    style={{ height: `${Math.round((m.received / maxVal) * 100)}%` }} />
                  <div className="flex-1 bg-brand-red rounded-t opacity-60 transition-all min-h-[2px]"
                    style={{ height: `${Math.round((m.expenses / maxVal) * 100)}%` }} />
                </div>
                <span className="text-[8px] text-text-muted">{MONTHS[m.month - 1]}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-2">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-state-mastered" /><span className="text-[9px] text-text-muted">Receita</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-brand-red opacity-60" /><span className="text-[9px] text-text-muted">Despesas</span></div>
          </div>
        </div>
      )}

      {/* Plan composition */}
      {summary?.by_plan && Object.keys(summary.by_plan).length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl p-4">
          <div className="text-[9px] tracking-widest text-text-hint mb-3">COMPOSIÇÃO DA RECEITA</div>
          <div className="space-y-2">
            {(Object.entries(summary.by_plan) as [PlanKey, number][]).map(([plan, amount]) => (
              <div key={plan} className="flex items-center gap-2">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border flex-shrink-0 ${PLAN_STYLES[plan]}`}>
                  {PLAN_LABELS[plan]}
                </span>
                <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
                  <div className="h-full bg-brand-red rounded-full"
                    style={{ width: `${summary.received > 0 ? Math.round((amount / summary.received) * 100) : 0}%` }} />
                </div>
                <span className="text-xs font-medium w-16 text-right flex-shrink-0">R$ {fmt(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4">
        <div className="text-[9px] tracking-widest text-text-hint mb-3">REGISTRAR DESPESA</div>
        <form onSubmit={handleExpense} className="flex gap-2 mb-3">
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descrição" required
            className="flex-1 bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
          <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            placeholder="R$" min={0.01} step={0.01} required
            className="w-24 bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
          <button type="submit" disabled={saving}
            className="bg-brand-red text-white text-xs px-3 rounded-lg disabled:opacity-50 hover:opacity-90">+</button>
        </form>
        {expenses.length === 0 ? (
          <div className="text-text-muted text-xs">Nenhuma despesa registrada.</div>
        ) : (
          <div className="space-y-1.5">
            {expenses.map(e => (
              <div key={e.id} className="flex items-center justify-between bg-surface-base border border-surface-border rounded-lg px-3 py-2">
                <span className="text-xs text-text-secondary">{e.description}</span>
                <span className="text-xs font-medium text-brand-red">R$ {fmt(e.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-surface-border mt-1">
              <span className="text-[9px] tracking-widest text-text-hint">TOTAL</span>
              <span className="text-sm font-medium text-brand-red">R$ {fmt(expenses.reduce((s, e) => s + e.amount, 0))}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Calculadora ─────────────────────────────────────────────────────────────

interface CalcPlan { qty: number; price: number }

function CalculadoraTab() {
  const [plans, setPlans] = useState<Record<PlanKey, CalcPlan>>({
    MENSALIDADE: { qty: 10, price: 180 },
    AVULSA:      { qty: 5,  price: 50  },
    PLANO_2X:    { qty: 3,  price: 170 },
    PLANO_3X:    { qty: 2,  price: 160 },
  })
  const [meta, setMeta] = useState(3000)
  const [despesas, setDespesas] = useState(800)

  const receita = (Object.values(plans) as CalcPlan[]).reduce((s, p) => s + p.qty * p.price, 0)
  const liquido = receita - despesas
  const faltaMeta = Math.max(0, meta - liquido)
  const pct = meta > 0 ? Math.min(100, Math.round((liquido / meta) * 100)) : 0
  const alunosFaltam = faltaMeta > 0 && plans.MENSALIDADE.price > 0
    ? Math.ceil(faltaMeta / plans.MENSALIDADE.price)
    : 0

  const setP = (plan: PlanKey, field: keyof CalcPlan, val: number) =>
    setPlans(prev => ({ ...prev, [plan]: { ...prev[plan], [field]: val } }))

  return (
    <div className="space-y-4">
      <div className="bg-surface-card border border-surface-border rounded-xl p-4">
        <div className="text-[9px] tracking-widest text-text-hint mb-3">MODELOS DE NEGÓCIO</div>
        <div className="space-y-4">
          {(Object.keys(PLAN_LABELS) as PlanKey[]).map(plan => (
            <div key={plan}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border ${PLAN_STYLES[plan]}`}>{PLAN_LABELS[plan]}</span>
                <span className="text-xs text-text-muted ml-auto">= R$ {fmt(plans[plan].qty * plans[plan].price)}</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-[9px] text-text-muted mb-1">ALUNOS</div>
                  <input type="number" min={0} value={plans[plan].qty}
                    onChange={e => setP(plan, 'qty', Number(e.target.value))}
                    className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
                </div>
                <div className="flex-1">
                  <div className="text-[9px] text-text-muted mb-1">VALOR (R$)</div>
                  <input type="number" min={0} step={1} value={plans[plan].price}
                    onChange={e => setP(plan, 'price', Number(e.target.value))}
                    className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-card border border-surface-border rounded-xl p-3">
          <div className="text-[9px] tracking-widest text-text-hint mb-1.5">META LÍQUIDA (R$)</div>
          <input type="number" value={meta} min={0}
            onChange={e => setMeta(Number(e.target.value))}
            className="w-full bg-surface-base border border-surface-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand-red" />
        </div>
        <div className="bg-surface-card border border-surface-border rounded-xl p-3">
          <div className="text-[9px] tracking-widest text-text-hint mb-1.5">DESPESAS (R$)</div>
          <input type="number" value={despesas} min={0}
            onChange={e => setDespesas(Number(e.target.value))}
            className="w-full bg-surface-base border border-surface-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-brand-red" />
        </div>
      </div>

      {/* Live results */}
      <div className="bg-surface-card border border-surface-border border-t-2 border-t-brand-red rounded-xl p-4">
        <div className="text-[9px] tracking-widest text-text-hint mb-3">PROJEÇÃO</div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <div className="text-[9px] text-text-muted mb-0.5">RECEITA BRUTA</div>
            <div className="text-base font-medium text-state-mastered">R$ {fmt(receita)}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-text-muted mb-0.5">DESPESAS</div>
            <div className="text-base font-medium text-brand-red">R$ {fmt(despesas)}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-text-muted mb-0.5">LÍQUIDO</div>
            <div className={`text-base font-medium ${liquido >= 0 ? 'text-state-mastered' : 'text-brand-red'}`}>
              R$ {fmt(liquido)}
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-text-muted">Progresso para a meta</span>
            <span className="font-medium text-brand-red">{pct}%</span>
          </div>
          <div className="h-2 bg-surface-border rounded-full overflow-hidden">
            <div className="h-full bg-brand-red rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {faltaMeta > 0 ? (
          <div className="bg-brand-red-dim border border-brand-red-border rounded-xl px-4 py-3 space-y-1">
            <div className="text-xs text-brand-red">
              Faltam <span className="font-medium">R$ {fmt(faltaMeta)}</span> para atingir a meta.
            </div>
            {alunosFaltam > 0 && (
              <div className="text-[11px] text-brand-red/80">
                Equivale a <span className="font-medium">{alunosFaltam} mensalidade{alunosFaltam !== 1 ? 's' : ''}</span> adicionais de R$ {fmt(plans.MENSALIDADE.price)}.
              </div>
            )}
          </div>
        ) : (
          <div className="bg-state-mastered-bg border border-state-mastered-border rounded-xl px-4 py-3">
            <div className="text-xs text-state-mastered font-medium">Meta atingida!</div>
            <div className="text-[11px] text-state-mastered/80 mt-0.5">Superando em R$ {fmt(Math.abs(faltaMeta))}.</div>
          </div>
        )}
      </div>
    </div>
  )
}
