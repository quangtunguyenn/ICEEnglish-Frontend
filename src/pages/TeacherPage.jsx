import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { MockStatsSection } from "../components/MockStatsSection";
import { getAuthProfile, logout } from "../services/api";
import { getUserRoles, hasUserRole } from "../utils/authRoles";

function readStoredProfile() {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    return null;
  }
}

export function TeacherPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(readStoredProfile);
  const [access, setAccess] = useState(() =>
    localStorage.getItem("accessToken") ? "checking" : "unauthorized",
  );

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("accessToken");
    if (!token)
      return () => {
        active = false;
      };

    getAuthProfile()
      .then((currentProfile) => {
        if (!active) return;
        setProfile(currentProfile);
        setAccess(
          hasUserRole(currentProfile, "TEACHER")
            ? "authorized"
            : "unauthorized",
        );
      })
      .catch(() => {
        if (active) setAccess("unauthorized");
      });

    return () => {
      active = false;
    };
  }, []);

  function signOut() {
    logout();
    navigate("/dang-nhap", { replace: true });
  }

  if (access === "checking") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f7fc] px-4 text-slate-500">
        <p
          className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold shadow-sm"
          role="status"
        >
          Đang xác minh quyền truy cập...
        </p>
      </main>
    );
  }

  if (access === "unauthorized") {
    const destination = getUserRoles(profile).includes("ADMIN")
      ? "/quan-tri"
      : "/";
    return (
      <Navigate
        replace
        to={localStorage.getItem("accessToken") ? destination : "/dang-nhap"}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-slate-900">
      <header className="border-b shadow-sm border-white/10 text-black ">
        <div className="mx-auto  flex min-h-20 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
          <div className="flex  min-w-0 items-center gap-3">
            <img
              alt=""
              aria-hidden="true"
              className="h-20 w-auto shrink-0 rounded-xl bg-white p-2"
              src="/logo.png"
            />
            <div className="min-w-0"></div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-5">
            <span className="hidden max-w-48 truncate uppercase font-gf text-xl font-semibold  sm:block">
              {profile?.fullName || profile?.username || "Giáo viên"}
            </span>

            <button
              onClick={signOut}
              type="button"
              className="group relative inline-flex items-center justify-center rounded-xl p-[1.5px] shadow-[0_4px_16px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ice-gold"
            >
              {/* Lớp viền gradient sáng rõ */}
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/45 via-white/20 to-white/45 transition-all duration-300 group-hover:from-ice-gold group-hover:via-amber-200 group-hover:to-ice-gold" />

              {/* Phần lõi nút */}
              <span className="relative inline-flex font-gf text-lg items-center gap-2 rounded-[10.5px] bg-neutral-950 px-3.5 py-2  font-bold text-white transition-colors duration-300 group-hover:bg-neutral-900 sm:px-4 sm:py-2.5 sm:text-sm">
                <span>ĐĂNG XUẤT</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 text-white/70 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-ice-gold"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 pb-14 pt-7 sm:px-7 sm:pt-10 lg:px-10">
        <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#102b5c] via-[#0d2348] to-[#07152e] px-6 py-8 text-white shadow-[0_24px_70px_-35px_rgba(7,21,46,0.65)] sm:px-9 sm:py-10 lg:px-12 lg:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-32 z-0 h-80 w-80 rounded-full bg-ice-gold/10 blur-3xl"
          />
          <img
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -right-4 z-0 w-64 opacity-[0.08] brightness-0 invert sm:right-6 sm:w-80"
            src="/ice_english_emblem_vector.svg"
          />
          <div className="relative z-10">
            <Link className="inline-flex rounded-lg bg-white px-4 py-2 text-sm font-bold text-[#102b5c] hover:bg-slate-100" to="/quan-tri">
              Quản lý đề thi
            </Link>
     
            <h1 className="mt-5 max-w-3xl font-gf text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Kết quả học tập,
              <br className="hidden sm:block" /> nhìn rõ từng bước tiến.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Không gian trình bày thống kê thi thử dành cho giáo viên và học
              sinh — theo dõi kết quả, phân bố điểm và những câu hỏi cần tập
              trung ôn luyện.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-xs font-semibold text-slate-400 sm:text-sm">
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                />
                Dữ liệu từ các đề đã công bố
              </span>
              <span className="text-white/20" aria-hidden="true">
                /
              </span>
              <span>Chọn một đề để xem phân tích chi tiết</span>
            </div>
          </div>
        </section>

        <div className="mt-7 sm:mt-9">
          <MockStatsSection />
        </div>
      </main>
    </div>
  );
}
