import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useGuestMode } from "../hooks/useGuestMode";
import { logout } from "../services/api";

const navigation = [
  { label: "Trang chủ", to: "/", end: true },
  {
    label: "Khóa học",
    items: [
      {
        label: "ICE Masterclass: Bứt phá điểm số THPTQG 2027",
        to: "/#tinh-nang",
      },
    ],
  },
  {
    label: "Phòng thi",
    items: [
      { label: "Luyện đề", to: "/luyen-de" },
      { label: "Thi thử", to: "/thi-thu" },
    ],
  },
  {
    label: "Học tập",
    items: [
      { label: "Bài giảng", to: "/video" },
      { label: "Từ vựng", to: "/tu-vung" },
      { label: "Thư viện", to: "/doc-hieu" },
    ],
  },
  { label: "Về chúng tôi", to: "/", plain: true },
];

export function MainLayout() {
  const guest = useGuestMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const [logoutError, setLogoutError] = useState("");

  function handleLogout() {
    try {
      logout();
      navigate("/", { replace: true });
      setLogoutError("");
    } catch {
      setLogoutError(
        "Không thể đăng xuất. Vui lòng kiểm tra quyền lưu trữ của trình duyệt và thử lại.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-1 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <NavLink
            aria-label="ICE English - Trang chủ"
            className="w-fit shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-600"
            to="/"
          >
            <img
              alt="ICE English"
              className="h-14 w-auto object-contain sm:h-16"
              src="/logo.jpg"
            />
          </NavLink>
          <div className="flex min-w-0 flex-col items-stretch gap-2 lg:flex-row lg:items-center lg:justify-end lg:gap-4">
            <nav
              aria-label="Điều hướng chính"
              className="flex min-w-0 flex-wrap items-center justify-start gap-1 lg:flex-none lg:justify-end"
            >
              {navigation.map((item) =>
                item.items ? (
                  <div
                    className="group relative shrink-0"
                    key={item.label}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget))
                        setOpenMenu(null);
                    }}
                    onFocus={() => setOpenMenu(item.label)}
                    onMouseEnter={() => setOpenMenu(item.label)}
                    onMouseLeave={() => setOpenMenu(null)}
                  >
                    <button
                      aria-expanded={openMenu === item.label}
                      aria-haspopup="true"
                      className={`flex text-[16   px] cursor-pointer items-center gap-12 rounded-xl px-3 py-2 font-semibold transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 ${
                        item.items.some(
                          (subItem) =>
                            location.pathname === subItem.to.split("#")[0],
                        )
                          ? "text-cyan-700"
                          : "text-slate-600 hover:text-slate-950"
                      }`}
                      onClick={() =>
                        setOpenMenu((currentMenu) =>
                          currentMenu === item.label ? null : item.label,
                        )
                      }
                      type="button"
                    >
                      {item.label}
                      <svg
                        aria-hidden="true"
                        className={`h-4 w-4 transition-transform ${openMenu === item.label ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="m5 7.5 5 5 5-5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.7"
                        />
                      </svg>
                    </button>
                    <div
                      className={`absolute right-0 top-full z-50 w-72 max-w-[calc(100vw-2rem)] pt-2 ${openMenu === item.label ? "block" : "hidden"} lg:left-0 lg:right-auto`}
                    >
                      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                        {item.items.map((subItem) => (
                          <Link
                            className="block rounded-xl px-4 py-3 text-sm font-semibold leading-5 text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-800 focus-visible:bg-cyan-50 focus-visible:outline-none"
                            key={subItem.to}
                            onClick={() => setOpenMenu(null)}
                            to={subItem.to}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : item.plain ? (
                  <Link
                    className="shrink-0 rounded-xl px-3 py-2 text-xl font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                    key={item.label}
                    to={item.to}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <NavLink
                    className={({ isActive }) =>
                      `shrink-0 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 ${
                        isActive
                          ? "bg-cyan-50 text-cyan-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      }`
                    }
                    end={item.end}
                    key={item.label}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                ),
              )}
            </nav>
            {guest ? (
              <NavLink
                className="shrink-0 self-end rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 lg:self-auto"
                to="/dang-nhap"
              >
                Đăng nhập
              </NavLink>
            ) : (
              <button
                className="shrink-0 self-end rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 lg:self-auto"
                onClick={handleLogout}
                type="button"
              >
                Đăng xuất
              </button>
            )}
          </div>
        </div>
        {logoutError && (
          <p
            className="mx-auto max-w-7xl px-4 pb-3 text-sm text-red-700 sm:px-6"
            role="alert"
          >
            {logoutError}
          </p>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
