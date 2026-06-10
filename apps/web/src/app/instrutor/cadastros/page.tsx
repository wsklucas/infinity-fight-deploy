'use client'
import { useState } from 'react'
import { createStudent, createInstructor } from '../../../lib/api'

export default function CadastrosPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="text-[9px] tracking-widest text-brand-red mb-1">GERENCIAR</div>
        <div className="text-xl font-medium">Cadastros</div>
      </div>
      <StudentForm />
      <InstructorForm />
    </div>
  )
}

function StudentForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ name: string; temp_password: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(null)
    setLoading(true)
    try {
      const data = await createStudent({ name, email })
      setSuccess({ name, temp_password: data.temp_password })
      setName('')
      setEmail('')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao cadastrar aluno')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <div className="text-[9px] tracking-widest text-text-hint mb-3">NOVO ALUNO</div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome completo"
          required
          className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red"
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="E-mail"
          required
          className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red"
        />
        {error && <p className="text-xs text-brand-red">{error}</p>}
        {success && (
          <div className="bg-state-mastered-bg border border-state-mastered-border rounded-lg px-4 py-3">
            <p className="text-xs text-state-mastered font-medium mb-1">Aluno cadastrado com sucesso!</p>
            <p className="text-[11px] text-text-muted">
              Senha temporária de <span className="font-medium text-text-primary">{success.name}</span>:
            </p>
            <p className="text-sm font-mono font-medium text-text-primary mt-1">{success.temp_password}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-red text-white text-xs font-medium tracking-wider py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'CADASTRANDO...' : 'CADASTRAR ALUNO'}
        </button>
      </form>
    </div>
  )
}

function InstructorForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)
    try {
      await createInstructor({ name, email, password })
      setSuccess(true)
      setName('')
      setEmail('')
      setPassword('')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao cadastrar professor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <div className="text-[9px] tracking-widest text-text-hint mb-3">NOVO PROFESSOR</div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome completo"
          required
          className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red"
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="E-mail"
          required
          className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Senha (mín. 6 caracteres)"
          required
          minLength={6}
          className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-red"
        />
        {error && <p className="text-xs text-brand-red">{error}</p>}
        {success && (
          <div className="bg-state-mastered-bg border border-state-mastered-border rounded-lg px-4 py-3">
            <p className="text-xs text-state-mastered font-medium">Professor cadastrado com sucesso!</p>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-red text-white text-xs font-medium tracking-wider py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'CADASTRANDO...' : 'CADASTRAR PROFESSOR'}
        </button>
      </form>
    </div>
  )
}
