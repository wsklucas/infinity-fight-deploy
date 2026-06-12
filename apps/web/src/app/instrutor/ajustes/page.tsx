'use client'
import { useEffect, useState } from 'react'
import { getAcademySettings, updateAcademySettings } from '../../../lib/api'
import { useAuth } from '../../../store/auth'
import { useRouter } from 'next/navigation'

const KEY_TYPE_LABELS: Record<string, string> = {
  email: 'E-mail',
  cpf: 'CPF',
  telefone: 'Telefone',
  aleatoria: 'Chave aleatória',
}

export default function AjustesPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [pixKey, setPixKey] = useState('')
  const [pixKeyType, setPixKeyType] = useState('email')
  const [pixRecipientName, setPixRecipientName] = useState('')
  const [pixBank, setPixBank] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.replace('/instrutor')
  }, [user, router])

  useEffect(() => {
    getAcademySettings()
      .then(d => {
        const a = d.academy
        setPixKey(a.pixKey ?? '')
        setPixKeyType(a.pixKeyType ?? 'email')
        setPixRecipientName(a.pixRecipientName ?? '')
        setPixBank(a.pixBank ?? '')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)
    try {
      await updateAcademySettings({
        pixKey: pixKey.trim() || null,
        pixKeyType: pixKey.trim() ? pixKeyType : null,
        pixRecipientName: pixRecipientName.trim() || null,
        pixBank: pixBank.trim() || null,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-red'

  if (loading) return <div className="text-text-muted text-sm">Carregando...</div>

  return (
    <div>
      <div className="text-[9px] tracking-widest text-brand-red mb-1">ADMIN</div>
      <div className="text-xl font-medium mb-1">Ajustes</div>
      <div className="text-xs text-text-muted mb-6">Configurações da academia</div>

      <form onSubmit={handleSubmit}>
        <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-4">
          <div className="text-xs font-medium tracking-widest text-text-secondary mb-4">CHAVE PIX</div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted tracking-widest mb-2">TIPO DE CHAVE</label>
              <select
                value={pixKeyType}
                onChange={e => setPixKeyType(e.target.value)}
                className={inputClass}
              >
                {Object.entries(KEY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted tracking-widest mb-2">CHAVE PIX</label>
              <input
                value={pixKey}
                onChange={e => setPixKey(e.target.value)}
                placeholder={
                  pixKeyType === 'email' ? 'academia@exemplo.com' :
                  pixKeyType === 'cpf' ? '000.000.000-00' :
                  pixKeyType === 'telefone' ? '+5511999999999' :
                  'Chave aleatória (UUID)'
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted tracking-widest mb-2">NOME DO RECEBEDOR</label>
              <input
                value={pixRecipientName}
                onChange={e => setPixRecipientName(e.target.value)}
                placeholder="Nome que aparece no app do banco"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted tracking-widest mb-2">BANCO</label>
              <input
                value={pixBank}
                onChange={e => setPixBank(e.target.value)}
                placeholder="Ex: Nubank, Itaú, Bradesco..."
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-brand-red-dim border border-brand-red-border rounded-lg px-3 py-2 text-xs text-brand-red mb-3">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-state-mastered-bg border border-state-mastered-border rounded-lg px-3 py-2 text-xs text-state-mastered mb-3">
            Configurações salvas com sucesso!
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-red hover:bg-brand-red-dark disabled:opacity-50 text-white font-medium text-sm py-3 rounded-lg transition-colors"
        >
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </form>
    </div>
  )
}
