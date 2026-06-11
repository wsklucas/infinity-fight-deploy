'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../store/auth'
import { firstPassword } from '../../lib/api'

export default function PrimeiroAcessoPage() {
  const router = useRouter()
  const { user, clearMustChangePassword, hydrate } = useAuth()
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    if (!user) return
    if (!user.mustChangePassword) {
      router.replace(user.role === 'STUDENT' ? '/aluno' : '/instrutor')
    }
  }, [user, router])

  if (!user || !user.mustChangePassword) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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
      await firstPassword(next)
      clearMustChangePassword()
      router.push(user.role === 'STUDENT' ? '/aluno' : '/instrutor')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao definir senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface-base">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-xs tracking-widest text-brand-red mb-1">INFINITY FIGHT</div>
          <div className="text-lg font-medium mb-1">Criar nova senha</div>
          <div className="text-xs text-text-muted">
            Olá, <span className="text-text-secondary">{user.name}</span>. Por segurança,
            defina uma senha pessoal antes de continuar.
          </div>
        </div>

        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted tracking-widest mb-2">NOVA SENHA</label>
              <input
                type="password"
                value={next}
                onChange={e => setNext(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-red"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted tracking-widest mb-2">CONFIRMAR SENHA</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-red"
              />
            </div>

            {error && (
              <div className="bg-brand-red-dim border border-brand-red-border rounded-lg px-3 py-2 text-xs text-brand-red">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-brand-red-dark disabled:opacity-50 text-white font-medium text-sm py-3 rounded-lg transition-colors"
            >
              {loading ? 'Salvando...' : 'Definir senha e entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
