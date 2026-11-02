import { NavLink, Outlet } from 'react-router-dom'

const navigation = [
  { label: 'Trang Chủ', to: '/', end: true },
  { label: 'Luyện đề', to: '/luyen-de' },
  { label: 'Thi thử', to: '/thi-thu' },
  { label: 'Video', to: '/video' },
  { label: 'Từ Vựng', to: '/tu-vung' },
]

export function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <NavLink className="text-xl font-extrabold tracking-tight text-slate-900" to="/">
            ICE<span className="text-cyan-500">English</span>
          </NavLink>
          <nav className="flex items-center gap-1 overflow-x-auto pl-4">
            {navigation.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-cyan-50 text-cyan-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
                end={item.end}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <NavLink
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            to="/dang-nhap"
          >
            Đăng nhập
          </NavLink>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
