import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ConsultationForm } from "../components/ConsultationForm";
import {
  getApiErrorMessage,
  getAuthProfile,
  loginStudent,
} from "../services/api";

function getUserRole(user) {
  const roles = [
    user?.role,
    ...(Array.isArray(user?.authorities) ? user.authorities : []),
  ];
  return roles.map((role) =>
    String(role || "")
      .toUpperCase()
      .replace(/^ROLE_/, ""),
  );
}

function getLoginErrorMessage(error) {
  if (error?.response?.status === 401)
    return "Tên đăng nhập hoặc mật khẩu không đúng, hoặc tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên nếu cần hỗ trợ.";
  if (error?.request && !error.response) {
    return "Không kết nối được API. Kiểm tra backend và cấu hình mạng rồi thử lại.";
  }
  return getApiErrorMessage(error, "Không thể đăng nhập. Vui lòng thử lại.");
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setCredentials((current) => ({ ...current, [name]: value }));
  }

  function showConsultationForm() {
    setError("");
    setIsConsultationOpen(true);
  }

  function showLoginForm() {
    setIsConsultationOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!credentials.username.trim() || !credentials.password) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const loginResult = await loginStudent({
        username: credentials.username.trim(),
        password: credentials.password,
      });
      let profile = loginResult?.user || loginResult?.student || null;
      if (!profile || !getUserRole(profile).length) {
        try {
          profile = await getAuthProfile();
        } catch (profileError) {
          setError(
            profileError?.request && !profileError.response
              ? "Đăng nhập thành công nhưng không thể kết nối để xác minh vai trò. Kiểm tra API /auth/profile."
              : getApiErrorMessage(
                  profileError,
                  "Đăng nhập thành công nhưng không lấy được thông tin tài khoản.",
                ),
          );
          return;
        }
      }

      const roles = getUserRole(profile);
      if (!roles.length) {
        setError(
          "Đăng nhập thành công nhưng server chưa trả về vai trò tài khoản.",
        );
        return;
      }
      const isStaff = roles.includes("ADMIN") || roles.includes("TEACHER");
      const requestedPath = location.state?.from?.pathname
        ? `${location.state.from.pathname}${location.state.from.search || ""}`
        : "";
      navigate(
        isStaff
          ? "/quan-tri"
          : requestedPath === "/quan-tri"
            ? "/"
            : requestedPath || "/",
        {
          replace: true,
        },
      );
    } catch (requestError) {
      setError(getLoginErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    // Dùng h-screen và overflow-hidden để khóa chặt layout bằng đúng 100% màn hình, không bị cuộn trang
    <main className="relative h-screen w-full overflow-hidden bg-white lg:grid lg:grid-cols-2">
      <section
        className={`relative z-10 flex h-full w-full flex-col overflow-y-auto bg-slate-50 px-6 py-8 transition-transform duration-700 ease-in-out sm:px-10 lg:col-start-1 lg:row-start-1 lg:rounded-3xl lg:border lg:border-slate-200/80 lg:px-14 lg:shadow-[0_20px_60px_-24px_rgba(15,23,42,0.22)] xl:px-20 ${
          isConsultationOpen ? "lg:translate-x-full" : ""
        }`}
      >
        <div className="relative mx-auto my-auto grid w-full max-w-md">
          <div
            aria-hidden={isConsultationOpen}
            className={`col-start-1 row-start-1 transition-all duration-500 ease-in-out ${
              isConsultationOpen
                ? "pointer-events-none absolute inset-x-0 top-0 translate-y-3 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
            inert={isConsultationOpen}
          >
            <Link
              aria-label="ICE English - Trang chủ"
              className="inline-flex rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-600"
              to="/"
            >
              <img
                alt="ICE English"
                className="h-auto w-auto max-w-full object-contain"
                src="/logo.png"
              />
            </Link>

            <div className="mt-8">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-cyan-600"></span>
              <h1 className="mt-3 font-gf text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Chào mừng trở lại !
              </h1>
              <p className="mt-2.5 text-[16px] font-inter leading-relaxed text-slate-500">
                Đăng nhập ngay để tiếp tục hành trình bứt phá điểm số và chinh
                phục mục tiêu của bạn.
              </p>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1.5 block font-p text-sm font-semibold text-slate-700">
                  Tên đăng nhập
                </span>
                <input
                  autoComplete="username"
                  className="w-full font-questrial rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-[16px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/15"
                  name="username"
                  onChange={updateField}
                  placeholder="Nhập tài khoản của bạn"
                  required
                  type="text"
                  value={credentials.username}
                />
              </label>

              <label className="block">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="block font-p text-sm font-semibold text-slate-700">
                    Mật khẩu
                  </span>
                </div>
                <input
                  autoComplete="current-password"
                  className="w-full font-questrial rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-[15px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/15"
                  name="password"
                  onChange={updateField}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={credentials.password}
                />
              </label>

              {error && (
                <div
                  aria-live="polite"
                  className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50 p-3.5 text-sm font-medium text-rose-700"
                >
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-rose-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p>{error}</p>
                </div>
              )}

              <button
                className="group hover:cursor-pointer relative mt-2 flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#102B5C] to-cyan-800 px-4 py-3.5 font-google-sans text-[16px] font-bold text-white shadow-lg shadow-cyan-900/20 transition-all duration-300 hover:from-cyan-900 hover:to-cyan-700 hover:shadow-xl hover:shadow-cyan-900/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2 ">
                    <svg
                      className="h-5 w-5 animate-spin text-white/70"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </form>

            <p className="mt-8 text-center font-lexend text-[15px] text-slate-500">
              Bạn chưa có tài khoản?{" "}
              <button
                className="font-semibold text-cyan-600 transition hover:text-cyan-700 hover:underline"
                onClick={showConsultationForm}
                type="button"
              >
                Nhận tư vấn lộ trình
              </button>
            </p>
          </div>

          <div
            aria-hidden={!isConsultationOpen}
            className={`col-start-1 row-start-1 transition-all duration-500 ease-in-out ${
              isConsultationOpen
                ? "translate-y-0 opacity-100"
                : "pointer-events-none absolute inset-x-0 top-0 translate-y-3 opacity-0"
            }`}
            inert={!isConsultationOpen}
          >
            <h1 className="sr-only">Tư vấn khóa học ICE Masterclass</h1>
            <ConsultationForm />

            <p className="mt-8 font-lexend text-[15px] text-center text-sm text-slate-500">
              Đã có tài khoản?{" "}
              <button
                className="font-semibold  text-cyan-600 transition hover:text-cyan-700 hover:underline"
                onClick={showLoginForm}
                type="button"
              >
                Đăng nhập
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* CỘT PHẢI: Đã tinh chỉnh khoảng cách h-full để không thừa scrollbar */}
      <section
        className={`relative hidden h-full overflow-hidden bg-[#0A162C] px-8 py-8 transition-transform duration-700 ease-in-out lg:col-start-2 lg:row-start-1 lg:flex lg:items-center lg:justify-center xl:px-16 ${
          isConsultationOpen ? "lg:-translate-x-full" : ""
        }`}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.15),transparent_55%),linear-gradient(180deg,#0A162C_0%,#060D1A_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-[100px]"
        />
        <div
          aria-hidden="true"
          className="absolute top-1/4 -right-32 h-80 w-80 rounded-full bg-blue-600/15 blur-[80px]"
        />

        <div className="relative z-10 flex w-full max-w-[440px] flex-col items-center">
          <div className="flex items-center gap-3 self-start">
            <div></div>
          </div>

          <div className="mt-7 text-center">
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.3] tracking-tight text-white xl:text-[2.5rem]">
              Sẵn sàng chinh phục <br />
              <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent drop-shadow-md">
                Đại học mơ ước
              </span>
              <br />
              {/* Khối chứa chữ "cùng" và Logo được tinh chỉnh khoảng cách */}
              <span className="mt-3 inline-flex items-center gap-3 xl:mt-4 xl:gap-4">
                {/* Chữ "cùng" chuyển sang màu xám sáng để làm nền, nhường sự nổi bật cho cụm từ trên và logo */}
                <span className="text-2xl font-bold text-slate-300 xl:text-[2.2rem]">
                  Cùng
                </span>

                {/* Vùng chứa Logo: Tinh giản, sáng mịn và sang trọng hơn */}
                <span className="relative flex shrink-0 items-center justify-center">
                  {/* 1. Lớp hào quang: Mở rộng vùng tỏa sáng (-inset-1), dùng màu sáng nhẹ và làm nhòe mềm mại (blur-lg) */}
                  <span className="absolute -inset-1 rounded-full bg-cyan-400 opacity-30 blur-lg animate-pulse"></span>

                  {/* 2. Lớp chứa logo: Viền mỏng nhẹ thanh lịch (ring-1 ring-white/50), đổ bóng êm dịu */}
                  <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg shadow-cyan-500/40 ring-1 ring-white/50 xl:h-16 xl:w-16">
                    <img
                      alt="Logo"
                      className="h-full w-full object-contain p-2"
                      src="/logo-mobile"
                    />
                  </span>
                </span>
              </span>
            </h2>
            <p className="mt-4 text-[15px] font-inter leading-relaxed text-slate-300/90">
              Nền tảng học tập thông minh giúp bạn làm chủ kiến thức, tối ưu hóa
              thời gian và sẵn sàng cho kỳ thi THPT Quốc Gia.
            </p>
          </div>

          <div className="mt-8 grid w-full gap-3 text-left">
            <article className="group flex items-start gap-3.5 rounded-2xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-md transition-all hover:bg-white/[0.06] hover:shadow-lg hover:shadow-cyan-900/10">
              <span className="flex h-10 w-10 font-p shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-400/10 text-xs font-bold text-cyan-300 shadow-inner ring-1 ring-white/10 group-hover:from-cyan-400/30">
                01
              </span>
              <div>
                <h3 className="font-lexend text-[14px] font-bold text-white transition-colors group-hover:text-cyan-200">
                  Luyện đề thực chiến
                </h3>
                <p className="mt-1 font-google-sans text-[13px] font-medium leading-relaxed text-slate-400">
                  Ngân hàng câu hỏi bám sát cấu trúc đề thi thật, giúp bạn rèn
                  luyện phản xạ.
                </p>
              </div>
            </article>

            <article className="group flex items-start gap-3.5 rounded-2xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-md transition-all hover:bg-white/[0.06] hover:shadow-lg hover:shadow-cyan-900/10">
              <span className="flex font-p h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-400/10 text-xs font-bold text-cyan-300 shadow-inner ring-1 ring-white/10 group-hover:from-cyan-400/30">
                02
              </span>
              <div>
                <h3 className="font-lexend text-[14px] font-bold text-white transition-colors group-hover:text-cyan-200">
                  Phòng thi ảo
                </h3>
                <p className="mt-1 font-google-sans text-[13px] font-medium leading-relaxed text-slate-400">
                  Mô phỏng áp lực thời gian thực tế, rèn luyện bản lĩnh phòng
                  thi hiệu quả.
                </p>
              </div>
            </article>

            <article className="group flex items-start gap-3.5 rounded-2xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-md transition-all hover:bg-white/[0.06] hover:shadow-lg hover:shadow-cyan-900/10">
              <span className="flex font-p h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-400/10 text-xs font-bold text-cyan-300 shadow-inner ring-1 ring-white/10 group-hover:from-cyan-400/30">
                03
              </span>
              <div>
                <h3 className="font-lexend text-[14px] font-bold text-white transition-colors group-hover:text-cyan-200">
                  Lấp lỗ hổng kiến thức
                </h3>
                <p className="mt-1 font-google-sans text-[13px] font-medium leading-relaxed text-slate-400">
                  Hệ thống bài giảng trực quan giúp bạn nắm bắt ngay những phần
                  còn yếu.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
