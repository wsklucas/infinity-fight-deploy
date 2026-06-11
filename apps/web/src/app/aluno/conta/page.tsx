'use client'
import { useAuth } from '../../../store/auth'
import { ChangePasswordForm } from '../../../components/ChangePasswordForm'

export default function AlunoContaPage() {
  const { user } = useAuth()

  return (
    <div>
      <div className="text-[9px] tracking-widest text-brand-red mb-1">CONTA</div>
      <div className="text-xl font-medium mb-1">Minha conta</div>
      <div className="text-xs text-text-muted mb-6">{user?.email}</div>

      <div className="bg-surface-card border border-surface-border rounded-xl p-5">
        <div className="text-xs font-medium tracking-widest text-text-secondary mb-4">ALTERAR SENHA</div>
        <ChangePasswordForm />
      </div>
    </div>
  )
}
