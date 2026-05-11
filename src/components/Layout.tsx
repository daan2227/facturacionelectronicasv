import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const nav = [
  { to: '/', label: 'Inicio', icon: '🏠' },
  { to: '/nuevo', label: 'Nueva Factura', icon: '➕' },
  { to: '/historial', label: 'Historial', icon: '📄' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
]

export default function Layout() {
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-sv-blue text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow">
        <span className="font-bold text-lg tracking-tight">FacturaSV</span>
        <button onClick={handleSignOut} className="text-xs opacity-80 hover:opacity-100">Salir</button>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="bg-white border-t border-gray-200 flex justify-around py-2 sticky bottom-0">
        {nav.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive ? 'text-sv-blue font-semibold' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
