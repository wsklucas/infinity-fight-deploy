'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../../store/auth'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <div className="border-b border-surface-border bg-surface-base">
        <div className="max-w-md mx-auto px-4 flex items-center justify-between py-3.5">
          <div>
            <div className="text-xs font-medium tracking-widest">INFINITY FIGHT</div>
            <div className="text-[9px] tracking-widest text-brand-red">PLATAFORMA</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-muted">{user?.name?.split(' ')[0]}</span>
            <button onClick={handleLogout} className="text-[10px] text-text-muted hover:text-brand-red">Sair</button>
          </div>
        </div>
        <div className="max-w-md mx-auto px-4 flex border-t border-surface-border">
          {[
            { href: '/aluno', label: 'Início' },
            { href: '/aluno/progressao', label: 'Progressão' },
            { href: '/aluno/agenda', label: 'Agenda' },
          ].map(item => (
            <Link key={item.href} href={item.href} className={`px-5 py-3 text-xs border-b-2 transition-colors ${pathname === item.href ? 'text-text-primary border-brand-red' : 'text-text-muted border-transparent hover:text-text-secondary'}`}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-md mx-auto px-4 py-5">{children}</div>
    </div>
  )
}
