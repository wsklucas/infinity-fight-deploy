'use client'
import { useState } from 'react'
import { changePassword } from '../lib/api'

export function ChangePasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (next.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres')
      return
    }
    if (next !== confirm) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)
    try {
      await changePassword(current, next)
      setSuccess(true)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label className="block text-xs text-text-muted tracking-widest mb-2">SENHA ATUAL</label>
        <input
          type="password"
          value={current}
          onChange={e => setCurrent(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-red"
        />
      </div>
      <div>
        <label className="block text-xs text-text-muted tracking-widest mb-2">NOVA SENHA</label>
        <input
          type="password"
          value={next}
          onChange={e => setNext(e.target.value)}
          required
          placeholder="Mínimo 6 caracteres"
          className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-red"
        />
      </div>
      <div>
        <label className="block text-xs text-text-muted tracking-widest mb-2">CONFIRMAR NOVA SENHA</label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-red"
        />
      </div>

      {error && (
        <div className="bg-brand-red-dim border border-brand-red-border rounded-lg px-3 py-2 text-xs text-brand-red">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-state-mastered-bg border border-state-mastered-border rounded-lg px-3 py-2 text-xs text-state-mastered">
          Senha alterada com sucesso!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-red hover:bg-brand-red-dark disabled:opacity-50 text-white font-medium text-sm py-3 rounded-lg transition-colors"
      >
        {loading ? 'Salvando...' : 'Alterar senha'}
      </button>
    </form>
  )
}
