import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  LogOut,
  Package,
  Receipt,
  Scissors,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Citas', icon: CalendarDays, end: true },
  { to: '/stylists', label: 'Estilistas', icon: Users },
  { to: '/services', label: 'Servicios', icon: Scissors },
  { to: '/inventory', label: 'Inventario', icon: Package },
  { to: '/invoices', label: 'Facturación', icon: Receipt },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const initials = user?.name
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-card">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Scissors className="size-5" />
          <span className="font-semibold">BarberFlow Admin</span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 border-t p-4">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-muted/20">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mx-auto max-w-6xl p-8"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
