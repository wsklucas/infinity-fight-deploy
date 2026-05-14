'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../store/auth'
import { useRouter } from 'next/navigation'

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const navItems = [
    { href: '/instrutor', label: 'Alunos' },
    { href: '/instrutor/avaliar', label: 'Avaliar' },
    { href: '/instrutor/fichas', label: 'Fichas' },
    { href: '/instrutor/historico', label: 'Histórico' },
  ]

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="border-b border-surface-border bg-surface-base">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between py-3.5">
          <div>
            <div className="text-xs font-medium tracking-widest">INFINITY FIGHT</div>
            <div className="text-[9px] tracking-widest text-brand-red">PLATAFORMA</div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">{user?.name}</span>
            <button onClick={handleLogout} className="text-xs text-text-muted hover:text-brand-red transition-colors">Sair</button>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 flex border-t border-surface-border scrollbar-none overflow-x-auto">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-3 text-xs border-b-2 transition-colors whitespace-nowrap ${
                pathname === item.href
                  ? 'text-text-primary border-brand-red'
                  : 'text-text-muted border-transparent hover:text-text-secondary'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-5">{children}</div>
    </div>
  )
}
