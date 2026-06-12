'use client'
import { useEffect, useState } from 'react'
import { getMyPayments, getAcademySettings } from '../../../lib/api'

const PLAN_LABELS: Record<string, string> = {
  MENSALIDADE: 'Mensalidade',
  AVULSA: 'Aula avulsa',
  PLANO_2X: 'Plano 2x/semana',
  PLANO_3X: 'Plano 3x/semana',
}

const KEY_TYPE_LABELS: Record<string, string> = {
  email: 'E-mail',
  cpf: 'CPF',
  telefone: 'Telefone',
  aleatoria: 'Chave aleatória',
}

const MONTH_NAMES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Payment {
  id: string
  plan: string
  amount: number
  month: number
  year: number
  paid: boolean
  paidAt: string | null
}

interface Academy {
  pixKey?: string | null
  pixKeyType?: string | null
  pixRecipientName?: string | null
  pixBank?: string | null
}

function PaymentRow({ p }: { p: Payment }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-surface-border/60 last:border-0">
      <div className="min-w-0">
        <div className="text-xs font-medium text-text-primary">{PLAN_LABELS[p.plan] ?? p.plan}</div>
        <div className="text-[10px] text-text-muted mt-0.5">{MONTH_NAMES[p.month]} {p.year}</div>
      </div>
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <span className="text-sm font-medium text-text-primary tabular-nums">{formatBRL(p.amount)}</span>
        {p.paid ? (
          <span className="text-[9px] font-medium px-2 py-0.5 rounded-sm border bg-state-mastered-bg text-state-mastered border-state-mastered-border tracking-wide">
            PAGO
          </span>
        ) : (
          <span className="text-[9px] font-medium px-2 py-0.5 rounded-sm border chip-avaliacao tracking-wide">
            PENDENTE
          </span>
        )}
      </div>
    </div>
  )
}

function PixCard({ academy }: { academy: Academy }) {
  const [copied, setCopied] = useState(false)
  if (!academy.pixKey) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(academy.pixKey!)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-brand-red flex-shrink-0" />
        <span className="text-[9px] tracking-widest text-text-hint">PAGAMENTO VIA PIX</span>
      </div>

      <div className="space-y-1.5 mb-3">
        {academy.pixRecipientName && (
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-text-muted">Recebedor</span>
            <span className="text-xs text-text-primary font-medium">{academy.pixRecipientName}</span>
          </div>
        )}
        {academy.pixBank && (
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-text-muted">Banco</span>
            <span className="text-xs text-text-secondary">{academy.pixBank}</span>
          </div>
        )}
        {academy.pixKeyType && (
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-text-muted">Tipo</span>
            <span className="text-xs text-text-secondary">{KEY_TYPE_LABELS[academy.pixKeyType] ?? academy.pixKeyType}</span>
          </div>
        )}
      </div>

      <div className="bg-surface-base border border-surface-border rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
        <span className="text-xs font-mono text-text-primary truncate">{academy.pixKey}</span>
        <button
          onClick={handleCopy}
          className={`text-[10px] font-medium flex-shrink-0 transition-colors ${copied ? 'text-state-mastered' : 'text-brand-red hover:text-brand-red-dark'}`}
        >
          {copied ? 'Copiado!' : 'Copiar chave'}
        </button>
      </div>
    </div>
  )
}

export default function FinanceiroPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [totalPaid, setTotalPaid] = useState(0)
  const [totalPending, setTotalPending] = useState(0)
  const [academy, setAcademy] = useState<Academy>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMyPayments(),
      getAcademySettings(),
    ]).then(([paymentsData, settingsData]) => {
      setPayments(paymentsData.payments)
      setTotalPaid(paymentsData.totalPaid)
      setTotalPending(paymentsData.totalPending)
      setAcademy(settingsData.academy)
    }).finally(() => setLoading(false))
  }, [])

  const pending = payments.filter(p => !p.paid)
  const paid = payments.filter(p => p.paid)

  if (loading) return <div className="text-text-muted text-sm">Carregando...</div>

  return (
    <div>
      <div className="text-[9px] tracking-widest text-brand-red mb-1">FINANCEIRO</div>
      <div className="text-xl font-medium mb-1">Minhas cobranças</div>
      <div className="text-xs text-text-muted mb-5">Somente consulta</div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="bg-surface-card border border-surface-border rounded-xl p-3.5">
          <div className="text-[9px] tracking-widest text-text-muted mb-1">TOTAL PAGO</div>
          <div className="text-base font-medium text-state-mastered">{formatBRL(totalPaid)}</div>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-xl p-3.5">
          <div className="text-[9px] tracking-widest text-text-muted mb-1">PENDENTE</div>
          <div className={`text-base font-medium ${totalPending > 0 ? 'text-state-developing' : 'text-text-muted'}`}>
            {formatBRL(totalPending)}
          </div>
        </div>
      </div>

      {/* PIX card — shown when there are pending payments and a key is configured */}
      {pending.length > 0 && academy.pixKey && <PixCard academy={academy} />}

      {payments.length === 0 ? (
        <div className="bg-surface-card border border-surface-border rounded-xl p-8 text-center">
          <p className="text-text-muted text-sm">Nenhuma cobrança registrada ainda.</p>
          <p className="text-text-hint text-xs mt-1">Suas cobranças aparecerão aqui quando o instrutor as lançar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              <div className="px-4 pt-4 pb-1 flex items-center gap-2">
                <span className="text-[9px] tracking-widest text-text-hint">PENDENTES</span>
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-sm bg-state-developing-bg text-state-developing border border-state-developing-border">
                  {pending.length}
                </span>
              </div>
              <div className="px-4 pb-2">
                {pending.map(p => <PaymentRow key={p.id} p={p} />)}
              </div>
            </div>
          )}

          {paid.length > 0 && (
            <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
              <div className="px-4 pt-4 pb-1 flex items-center gap-2">
                <span className="text-[9px] tracking-widest text-text-hint">PAGAS</span>
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-sm bg-state-mastered-bg text-state-mastered border border-state-mastered-border">
                  {paid.length}
                </span>
              </div>
              <div className="px-4 pb-2">
                {paid.map(p => <PaymentRow key={p.id} p={p} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
