import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useGuestMode } from '../hooks/useGuestMode'
import { logout } from '../services/api'

const navigation = [
  { label: 'Trang Chủ', to: '/', end: true },
  { label: 'Luyện đề', to: '/luyen-de' },
  { label: 'Thi thử', to: '/thi-thu' },
  { label: 'Video', to: '/video' },
  { label: 'Từ Vựng', to: '/tu-vung' },
]

export function MainLayout() {
  const guest = useGuestMode()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')

  function handleLogout() {
    try {
      logout()
      navigate('/', { replace: true })
      setLogoutError('')
    } catch {
      setLogoutError('Không thể đăng xuất. Vui lòng kiểm tra quyền lưu trữ của trình duyệt và thử lại.')
    }
  }

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
          {guest ? (
            <NavLink
              className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              to="/dang-nhap"
            >
              Đăng nhập
            </NavLink>
          ) : (
            <button
              className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              onClick={handleLogout}
              type="button"
            >
              Đăng xuất
            </button>
          )}
        </div>
        {logoutError && <p className="mx-auto max-w-7xl px-6 pb-3 text-sm text-red-700" role="alert">{logoutError}</p>}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
