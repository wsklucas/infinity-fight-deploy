'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../store/auth'
import { useTheme } from '../../store/theme'
import { useRouter } from 'next/navigation'

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema"
      className="p-1.5 rounded-md text-text-muted hover:text-text-primary transition-colors"
    >
      {theme === 'dark' ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}

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
    { href: '/instrutor/ingresso', label: 'Ingresso' },
    { href: '/instrutor/avaliar', label: 'Avaliar' },
    { href: '/instrutor/fichas', label: 'Fichas' },
    { href: '/instrutor/historico', label: 'Histórico' },
    { href: '/instrutor/agenda', label: 'Agenda' },
    { href: '/instrutor/financeiro', label: 'Financeiro' },
    { href: '/instrutor/cadastros', label: 'Cadastros' },
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
            <ThemeToggle />
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
