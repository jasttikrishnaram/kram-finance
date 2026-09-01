import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/transactions', label: 'Transactions' },
  { to: '/bills', label: 'Bills & EMIs' },
  { to: '/insights', label: 'Insights' },
  { to: '/settings', label: 'Settings' },
]

export default function Layout() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-paper text-textdark font-sans">
      {/* Desktop sidebar */}
      <div className="md:flex">
        <aside className="hidden md:flex md:flex-col md:w-56 md:min-h-screen bg-ink text-paper px-6 py-8 sticky top-0 h-screen">
          <div className="font-display text-2xl mb-10 tracking-tight">Kram Finance</div>
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-sm text-sm transition-colors ${
                    isActive ? 'bg-goldlight/20 text-goldlight' : 'text-paper/70 hover:text-paper hover:bg-white/5'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={signOut}
            className="mt-auto text-sm text-paper/50 hover:text-paper text-left"
          >
            Sign out
          </button>
        </aside>

        <main className="flex-1 pb-24 md:pb-0">
          <div className="max-w-4xl mx-auto px-5 py-6 md:px-10 md:py-10">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-ink border-t border-black/30 flex justify-around py-2 z-20">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex-1 text-center text-[11px] py-1.5 rounded-sm mx-1 ${
                isActive ? 'text-goldlight' : 'text-paper/60'
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
