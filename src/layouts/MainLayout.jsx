import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Link,
  matchPath,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { SiteFooter } from "../components/SiteFooter";
import { scrollCurrentPageLinkToTop } from "../utils/navigationScroll";
import { useGuestMode } from "../hooks/useGuestMode";
import { getApiErrorMessage, getAuthProfile, logout } from "../services/api";
import { getProfileInitial } from "../utils/profile";

const navigation = [
  { label: "TRANG CHỦ", to: "/", end: true },
  {
    label: "KHÓA HỌC",
    items: [
      {
        label: "ICE Masterclass: Bứt phá điểm số THPTQG 2027",
        to: "/#tinh-nang",
      },
    ],
  },
  {
    label: "PHÒNG THI",
    items: [
      { label: "LUYỆN ĐỀ", to: "/luyen-de" },
      { label: "THI THỬ", to: "/thi-thu" },
    ],
  },
  {
    label: "HỌC TẬP",
    items: [
      { label: "HỆ THỐNG BÀI GIẢNG", to: "/video" },
      { label: "LUYỆN TẬP TỪ VỰNG", to: "/tu-vung" },
      { label: "THƯ VIỆN ĐỌC HIỂU", to: "/doc-hieu" },
    ],
  },
  { label: "VỀ CHÚNG TÔI", to: "/", plain: true },
];

function subscribeFullscreen(callback) {
  document.addEventListener("fullscreenchange", callback);
  return () => document.removeEventListener("fullscreenchange", callback);
}

function getFullscreenSnapshot() {
  return Boolean(document.fullscreenElement);
}

function getServerFullscreenSnapshot() {
  return false;
}

function subscribeAuth(callback) {
  window.addEventListener("iceenglish:auth-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("iceenglish:auth-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getAuthToken() {
  return typeof localStorage === "undefined" ? null : localStorage.getItem("accessToken");
}

function AccountMenu({ onLogout, open, setOpen }) {
  const token = useSyncExternalStore(subscribeAuth, getAuthToken, getAuthToken);
  const [profileState, setProfileState] = useState({ token: null, profile: null, error: "" });
  const [attempt, setAttempt] = useState(0);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    getAuthProfile()
      .then((profile) => {
        if (typeof profile?.fullName !== "string" || !profile.fullName.trim()) {
          throw new Error("Hồ sơ chưa có họ tên. Vui lòng thử lại.");
        }
        if (active) setProfileState({ token, profile, error: "" });
      })
      .catch((error) => {
        if (active) {
          setProfileState({
            token,
            profile: null,
            error: getApiErrorMessage(error, "Không thể tải thông tin tài khoản. Vui lòng thử lại."),
          });
        }
      });
    return () => { active = false; };
  }, [token, attempt]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, setOpen]);

  const current = profileState.token === token ? profileState : null;
  const fullName = current?.profile?.fullName?.trim();
  const initial = getProfileInitial(fullName);

  return (
    <div
      className="relative mx-3 mt-3 border-t border-slate-200 pt-4 lg:col-start-3 lg:row-start-1 lg:mx-0 lg:mt-0 lg:justify-self-end lg:border-0 lg:pt-0"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
      ref={menuRef}
    >
      <button
        aria-controls="account-menu"
        aria-expanded={open}
        aria-label="Tài khoản"
        className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ice-gold bg-ice-navy font-gf text-lg font-bold text-white shadow-[0_6px_18px_-8px_rgba(16,43,92,0.65)] transition hover:scale-105 hover:shadow-[0_8px_22px_-7px_rgba(16,43,92,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ice-gold motion-reduce:transition-none"
        onClick={() => setOpen(!open)}
        ref={buttonRef}
        type="button"
      >
        {initial || (
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
          </svg>
        )}
      </button>
      {open && (
        <div className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_45px_-18px_rgba(16,43,92,0.32)] lg:absolute lg:right-0 lg:top-full lg:z-50 lg:w-72" id="account-menu">
          <p className="font-manrope text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Tài khoản</p>
          {fullName ? (
            <p className="mt-2 break-words font-gf text-base font-bold text-ice-navy">{fullName}</p>
          ) : current?.error ? (
            <div className="mt-2 text-sm text-red-700" role="alert">
              <p>{current.error}</p>
              <button
                className="mt-2 font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-ice-gold"
                onClick={() => {
                  setProfileState({ token, profile: null, error: "" });
                  setAttempt((value) => value + 1);
                }}
                type="button"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500" role="status">Đang tải thông tin...</p>
          )}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <button
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-gf text-sm font-bold text-ice-navy transition hover:bg-ice-gold-50 focus-visible:outline-2 focus-visible:outline-ice-gold"
              onClick={onLogout}
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M10 17v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h1a3 3 0 0 1 3 3v1M14 8l4 4-4 4m4-4H8" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MainLayout() {
  const guest = useGuestMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [headerVisible, setHeaderVisible] = useState(true);
  const menuButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const closeMenuButtonRef = useRef(null);
  const isFullscreen = useSyncExternalStore(
    subscribeFullscreen,
    getFullscreenSnapshot,
    getServerFullscreenSnapshot,
  );
  const isMockEntrance = Boolean(matchPath("/thi-thu/:examId/vao-phong", location.pathname));
  const isImmersivePage = [
    "/luyen-de/:examId",
    "/thi-thu/:examId",
    "/thi-thu/:examId/vao-phong",
    "/video/:videoId/homework",
  ].some((path) => matchPath(path, location.pathname));

  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenMenu(null);
    setAccountMenuOpen(false);
    setHeaderVisible(true);
  }, [location.pathname, location.search]);

  useEffect(() => {
    let previousScrollY = Math.max(0, window.scrollY);

    function handleScroll() {
      const scrollY = Math.max(0, window.scrollY);
      const difference = scrollY - previousScrollY;

      if (scrollY <= 0 || difference < -2) {
        setHeaderVisible(true);
      } else if (difference > 2) {
        setHeaderVisible(false);
        setMobileMenuOpen(false);
        setOpenMenu(null);
        setAccountMenuOpen(false);
      } else {
        return;
      }

      previousScrollY = scrollY;
    }

    function handlePointerMove(event) {
      if (event.pointerType === "mouse" && event.clientY <= 20) {
        setHeaderVisible(true);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeMenuButtonRef.current?.focus();
    const desktop = window.matchMedia("(min-width: 1024px)");

    function handleBreakpointChange(event) {
      if (event.matches) {
        setMobileMenuOpen(false);
        setOpenMenu(null);
        setAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeMobileMenu();
      } else if (event.key === "Tab") {
        const focusable = Array.from(
          mobileMenuRef.current?.querySelectorAll("a[href], button:not([disabled])") ?? [],
        ).filter((element) => !element.closest("[inert]") && element.getClientRects().length > 0);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    desktop.addEventListener("change", handleBreakpointChange);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", handleBreakpointChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
    setOpenMenu(null);
    setAccountMenuOpen(false);
    menuButtonRef.current?.focus();
  }

  function handleLogout() {
    setMobileMenuOpen(false);
    setOpenMenu(null);
    setAccountMenuOpen(false);
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
    <div className="min-h-screen bg-slate-50 ">
      <header
        onClickCapture={scrollCurrentPageLinkToTop}
        className={`sticky border-b border-[#102b5c]/10 bg-white/95 shadow-[0_8px_28px_-22px_rgba(16,43,92,0.3)] transition-[top,translate,opacity] duration-300 ease-in-out motion-reduce:transition-none lg:backdrop-blur-xl ${
          mobileMenuOpen
            ? "top-0 z-[80] opacity-100"
            : headerVisible
              ? "top-0 z-50 opacity-100 lg:translate-y-0"
              : "pointer-events-none -top-24 z-50 opacity-0 lg:top-0 lg:-translate-y-full"
        }`}
        hidden={isMockEntrance || (isImmersivePage && isFullscreen)}
        onFocusCapture={() => setHeaderVisible(true)}
      >
        <div className="mx-auto max-w-[1400px] px-4 pt-2 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center lg:gap-x-2 lg:px-0 xl:gap-x-4">
          <div className="flex min-w-0 items-center justify-between gap-3 py-1 lg:col-start-1 lg:row-start-1">
            <NavLink
              aria-label="ICE English - Trang chủ"
              className="inline-flex min-w-0 flex-1 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ice-gold lg:w-full lg:max-w-[320px] lg:flex-none"
              to="/"
            >
              <picture className="block min-w-0 max-w-full lg:w-full lg:max-w-[240px] xl:max-w-[280px]">
                <source media="(max-width: 1023px)" srcSet="/logo.png" />
                <img
                  alt="Logo ICE"
                  // Mobile: Cố định chiều cao (h-12 hoặc h-14), chiều rộng tự co giãn (w-auto)
                  // Desktop (lg): Chiều cao tự động (h-auto), chiều rộng tràn theo max-width của thẻ picture bọc ngoài
                  className="h-12 w-auto max-w-full object-contain lg:h-auto lg:w-full"
                  src="/logo.png"
                />
              </picture>
            </NavLink>
            {/* Icon hamburger mobile nằm bên phải logo trong hàng đầu của header. */}
            <button
              aria-controls="main-navigation"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#102B5C] transition hover:border-ice-gold-300 hover:bg-ice-gold-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ice-gold lg:hidden"
              onClick={() => {
                setMobileMenuOpen((isOpen) => {
                  if (isOpen) setOpenMenu(null);
                  return !isOpen;
                });
              }}
              ref={menuButtonRef}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    d="m6 6 12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.8"
                  />
                ) : (
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.8"
                  />
                )}
              </svg>
            </button>
          </div>
          <button
            aria-hidden="true"
            className={`fixed inset-0 z-[85] bg-ice-navy/55 transition-[opacity,visibility] duration-300 motion-reduce:transition-none lg:hidden ${
              mobileMenuOpen ? "visible opacity-100" : "invisible pointer-events-none opacity-0"
            }`}
            onClick={closeMobileMenu}
            tabIndex={-1}
            type="button"
          />
          <div
            aria-label={mobileMenuOpen ? "Menu điều hướng" : undefined}
            aria-modal={mobileMenuOpen ? "true" : undefined}
            className={`fixed inset-y-0 right-0 z-[90] flex w-[min(22rem,90vw)] min-w-0 flex-col overflow-hidden bg-white shadow-2xl transition-[translate,visibility] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none lg:static lg:z-auto lg:contents lg:w-auto lg:overflow-visible lg:bg-transparent lg:shadow-none lg:transition-none ${
              mobileMenuOpen
                ? "visible translate-x-0"
                : "invisible translate-x-full lg:visible lg:translate-x-0"
            }`}
            id="main-navigation"
            ref={mobileMenuRef}
            role={mobileMenuOpen ? "dialog" : undefined}
          >
            <div className="relative shrink-0 overflow-hidden border-b-4 border-ice-gold bg-ice-navy px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] text-white lg:hidden">
              <img alt="" aria-hidden="true" className="pointer-events-none absolute -right-7 -top-10 w-40 opacity-15 mix-blend-screen grayscale invert" src="/ice_english_emblem_vector.svg" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="font-manrope text-xs font-extrabold uppercase tracking-[0.18em] text-ice-gold">ICE English</p>
                  <p className="mt-2 font-gf text-xl font-bold">Khám phá</p>
                  <p className="mt-1 text-xs text-white/70">Hành trình chinh phục tiếng Anh</p>
                </div>
                <button
                  aria-label="Đóng menu"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ice-gold"
                  onClick={closeMobileMenu}
                  ref={closeMenuButtonRef}
                  type="button"
                >
                  <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
            <img alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-12 -right-12 w-64 opacity-[0.05] lg:hidden" src="/ice_english_emblem_vector.svg" />
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col items-stretch gap-2 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 lg:contents lg:overflow-visible lg:p-0">
              <nav
                aria-label="Điều hướng chính"
                className="flex min-w-0 flex-col items-stretch gap-1 lg:col-start-2 lg:row-start-1 lg:flex-row lg:items-center lg:justify-center lg:gap-1 xl:gap-2"
              >
                {navigation.map((item) =>
                  item.items ? (
                    <div
                      className="group relative w-full shrink-0 lg:w-auto"
                      key={item.label}
                    >
                      <button
                        aria-expanded={openMenu === item.label}
                        aria-haspopup="true"
                        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 font-cal-sans text-left text-[15px] font-semibold transition hover:bg-ice-gold-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ice-gold lg:w-auto lg:px-2 lg:text-[14px] xl:px-3 xl:text-[16px] ${
                          item.label === "KHÓA HỌC"
                            ? "text-yellow-600 hover:text-ice-gold-800"
                            : "text-[#102B5C] hover:text-[#102B5C]"
                        }`}
                        onClick={() => {
                          if (
                            window.matchMedia("(max-width: 1023px)").matches
                          ) {
                            setOpenMenu((currentMenu) =>
                              currentMenu === item.label ? null : item.label,
                            );
                          }
                        }}
                        type="button"
                      >
                        {item.label}
                        {/* Chevron submenu nằm bên phải tên danh mục, dùng chung cho mobile và desktop. */}
                        <svg
                          aria-hidden="true"
                          className={`h-5 w-5 transition-transform duration-200 lg:group-hover:rotate-180 ${
                            openMenu === item.label ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 20 20"
                        >
                          <path
                            d="m5 7.5 5 5 5-5"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.1"
                          />
                        </svg>
                      </button>
                      <div
                        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out motion-reduce:transition-none lg:absolute lg:left-0 lg:right-auto lg:top-full lg:z-50 lg:w-72 lg:max-w-[calc(100vw-2rem)] lg:pt-2 lg:group-hover:pointer-events-auto lg:group-hover:grid-rows-[1fr] lg:group-hover:opacity-100 lg:group-has-[:focus-visible]:pointer-events-auto lg:group-has-[:focus-visible]:grid-rows-[1fr] lg:group-has-[:focus-visible]:opacity-100 ${
                          openMenu === item.label
                            ? "grid-rows-[1fr] opacity-100 lg:pointer-events-none lg:grid-rows-[0fr] lg:opacity-0"
                            : "pointer-events-none grid-rows-[0fr] opacity-0 lg:pointer-events-none lg:grid-rows-[0fr] lg:opacity-0"
                        }`}
                        inert={mobileMenuOpen && openMenu !== item.label ? true : undefined}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <div className="ml-3 min-w-0 border-l-2 border-ice-gold-300 pl-2 lg:ml-0 lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:p-2 lg:shadow-[0_18px_40px_-18px_rgba(16,43,92,0.35)]">
                            {item.items.map((subItem) => (
                              <Link
                                className={`block whitespace-normal break-words rounded-xl px-3 py-2.5 ${
                                  item.label === "KHÓA HỌC"
                                    ? "font-playwrite text-[18px]"
                                    : "font-gf text-[16px]"
                                } font-semibold leading-5 text-[#102B5C] transition duration-200 hover:translate-x-1 hover:bg-ice-gold-50 hover:text-yellow-600 focus-visible:translate-x-1 focus-visible:bg-ice-gold-50 focus-visible:text-ice-gold-800 focus-visible:outline-2 focus-visible:outline-ice-gold motion-reduce:transition-none lg:px-4 lg:py-3`}
                                key={subItem.to}
                                onClick={() => {
                                  setOpenMenu(null);
                                  setMobileMenuOpen(false);
                                }}
                                to={subItem.to}
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : item.plain ? (
                    <Link // ve chung toi item
                      className="w-full shrink-0 rounded-xl px-3 py-2 font-cal-sans  text-base font-semibold text-[#102B5C] transition hover:bg-ice-gold-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ice-gold lg:w-auto lg:px-2 lg:text-[14px] xl:px-3 xl:text-[16px]"
                      key={item.label}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setOpenMenu(null);
                      }}
                      to={item.to}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <NavLink
                      className={(
                        { isActive }, // trang chu item
                      ) =>
                        `w-full shrink-0 rounded-xl px-3 py-2 font-cal-sans text-base font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ice-gold lg:w-auto lg:px-2 lg:text-[14px] xl:px-3 xl:text-[16px] ${
                          isActive
                            ? "bg-ice-gold-50 text-[#102B5C]"
                            : "text-[#102B5C] hover:bg-ice-gold-50"
                        }`
                      }
                      end={item.end}
                      key={item.label}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setOpenMenu(null);
                      }}
                      to={item.to}
                    >
                      {item.label}
                    </NavLink>
                  ),
                )}
              </nav>
              {guest ? (
                <div className="flex flex-wrap items-center gap-2 px-3 pt-2 lg:col-start-3 lg:row-start-1 lg:flex-nowrap lg:justify-self-end lg:self-center lg:px-0 lg:pt-0">
                  <Link
                    className="group relative inline-flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-full border border-ice-gold bg-ice-gold-50 px-4 py-2 font-gf text-sm font-bold text-ice-gold-800 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-ice-gold hover:bg-ice-gold-100 hover:shadow-[0_8px_20px_-10px_rgba(180,120,0,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ice-gold active:translate-y-0 lg:self-center lg:px-2 lg:py-2.5 lg:text-[13px] xl:px-5 xl:text-[15px]"
                    onClick={() => {
                      setOpenMenu(null);
                      setMobileMenuOpen(false);
                    }}
                    to="/#lo-trinh"
                  >
                    <span className="relative z-10 font-cal-sans text-[15px]">LỘ TRÌNH HỌC</span>
                    {/* Hiệu ứng quét sáng lướt qua */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ice-gold-200/40 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full"></div>
                  </Link>

                  <NavLink
                    className="group relative inline-flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-full bg-[#102B5C] px-5 py-2 font-gf text-sm font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#1b407a] hover:shadow-[0_8px_20px_-10px_rgba(16,43,92,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ice-gold active:translate-y-0 lg:self-center lg:px-2 lg:py-2.5 lg:text-[13px] xl:px-6 xl:text-[16px]"
                    onClick={() => {
                      setOpenMenu(null);
                      setMobileMenuOpen(false);
                    }}
                    to="/dang-nhap"
                  >
                    <span className="relative font-cal-sans text-[15px] z-10 flex items-center gap-2">
                      ĐĂNG NHẬP
                      {/* Mũi tên trượt ra từ bên trái khi hover */}
                      <svg
                        className="h-4 w-4 -translate-x-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </span>
                    {/* Hiệu ứng tia sáng phản quang chéo */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full"></div>
                  </NavLink>
                </div>
              ) : (
                <AccountMenu
                  onLogout={handleLogout}
                  open={accountMenuOpen}
                  setOpen={setAccountMenuOpen}
                />
              )}
            </div>
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
      {!isImmersivePage && <SiteFooter />}
    </div>
  );
}
