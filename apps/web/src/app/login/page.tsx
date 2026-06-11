'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../store/auth'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      const user = useAuth.getState().user
      if (user?.role === 'STUDENT') router.push('/aluno')
      else router.push('/instrutor')
    } catch {
      setError('Email ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-xs tracking-widest text-brand-red mb-1">INFINITY FIGHT</div>
          <div className="text-lg font-medium">Entrar na plataforma</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-text-muted tracking-widest mb-2">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-red"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted tracking-widest mb-2">SENHA</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-red"
              placeholder="••••••••"
              required
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
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

      </div>
    </div>
  )
}
