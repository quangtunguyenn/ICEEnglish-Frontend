import { useEffect, useRef, useState } from "react";
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
  const [showPassword, setShowPassword] = useState(false);
  const loginHeadingRef = useRef(null);
  const consultationHeadingRef = useRef(null);
  const switchedFormRef = useRef(false);

  useEffect(() => {
    if (switchedFormRef.current) {
      (isConsultationOpen ? consultationHeadingRef : loginHeadingRef).current?.focus({ preventScroll: true });
    }
  }, [isConsultationOpen]);

  function updateField(event) {
    const { name, value } = event.target;
    setCredentials((current) => ({ ...current, [name]: value }));
  }

  function showConsultationForm() {
    setError("");
    switchedFormRef.current = true;
    setIsConsultationOpen(true);
  }

  function showLoginForm() {
    switchedFormRef.current = true;
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
    <main className="relative h-[100dvh] w-full overflow-hidden bg-white lg:grid lg:grid-cols-2">
      <section
        className={`relative z-10 flex h-full w-full flex-col overflow-y-auto bg-[#f7f9fc] px-5 py-8 transition-transform duration-700 ease-in-out sm:px-10 lg:col-start-1 lg:row-start-1 lg:px-8 lg:shadow-[0_20px_60px_-24px_rgba(15,23,42,0.22)] xl:px-12 ${
          isConsultationOpen ? "lg:translate-x-full" : ""
        }`}
      >
        <div className={`relative mx-auto my-auto grid w-full ${isConsultationOpen ? "max-w-2xl" : "max-w-md"}`}>
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
              className="inline-flex rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ice-gold"
              to="/"
            >
              <img
                alt="ICE English"
                className="h-auto w-48 max-w-full object-contain sm:w-56"
                src="/logo.png"
              />
            </Link>

            <div className="mt-10">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-ice-gold-700">
                <span aria-hidden="true" className="h-px w-8 bg-ice-gold" />
                Hành trình cùng ICE
              </span>
              <h1 className="mt-3 font-gf text-3xl font-extrabold tracking-tight text-ice-navy sm:text-4xl" ref={loginHeadingRef} tabIndex={-1}>
                Chào mừng trở lại!
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-[16px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-ice-navy focus:ring-4 focus:ring-ice-navy/10"
                  name="username"
                  onChange={updateField}
                  placeholder="Nhập tài khoản của bạn"
                  required
                  type="text"
                  value={credentials.username}
                />
              </label>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block font-p text-sm font-semibold text-slate-700" htmlFor="login-password">
                    Mật khẩu
                  </label>
                </div>
                <div className="relative">
                  <input
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-4 pr-20 text-[16px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-ice-navy focus:ring-4 focus:ring-ice-navy/10"
                    id="login-password"
                    name="password"
                    onChange={updateField}
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                  />
                  <button
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 rounded-lg px-4 text-sm font-semibold text-ice-navy hover:text-ice-gold-700 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ice-gold"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    {showPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </div>

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
                className="relative mt-2 flex w-full cursor-pointer items-center justify-center rounded-xl bg-ice-navy px-4 py-4 text-[16px] font-bold text-white shadow-lg shadow-ice-navy/15 transition hover:bg-[#20477e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ice-gold disabled:cursor-not-allowed disabled:opacity-70"
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

            <p className="mt-8 border-t border-slate-200 pt-6 text-center text-[15px] text-slate-500">
              Bạn chưa có tài khoản?{" "}
              <button
                className="font-semibold text-ice-navy transition hover:text-ice-gold-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ice-gold"
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
            <h1 className="sr-only" ref={consultationHeadingRef} tabIndex={-1}>Tư vấn khóa học ICE Masterclass</h1>
            <ConsultationForm />

            <p className="mt-8 font-lexend text-[15px] text-center text-sm text-slate-500">
              Đã có tài khoản?{" "}
              <button
                className="font-semibold text-ice-navy transition hover:text-ice-gold-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ice-gold"
                onClick={showLoginForm}
                type="button"
              >
                Đăng nhập
              </button>
            </p>
          </div>
        </div>
      </section>

      <section
        className={`relative hidden h-full overflow-x-hidden overflow-y-auto bg-[#091a38] px-8 py-8 text-white transition-transform duration-700 ease-in-out lg:col-start-2 lg:row-start-1 lg:flex xl:px-16 ${
          isConsultationOpen ? "lg:-translate-x-full" : ""
        }`}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(48,100,162,0.4),transparent_45%),linear-gradient(145deg,#102b5c,#07152e)]" />
        <img alt="" aria-hidden="true" className="pointer-events-none absolute -right-24 -top-20 w-96 opacity-[0.12] brightness-0 invert" src="/ice_english_emblem_vector.svg" />

        <div className="relative z-10 mx-auto my-auto w-full max-w-lg">
          <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-ice-gold">
            <span aria-hidden="true" className="h-px w-9 bg-ice-gold" />
            Đồng hành cùng ICE English
          </p>
          <h2 className="mt-6 font-gf text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Vững kiến thức.<br /><span className="text-ice-gold">Vững vàng tâm thế.</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
            Từng bài giảng, lần luyện tập và trải nghiệm phòng thi đều là một bước tiến trên hành trình của bạn.
          </p>

          <div className="mt-8 grid gap-3">
            {[
              ["01", "Luyện đề có định hướng", "Rèn luyện và xem lại từng bài làm."],
              ["02", "Làm quen phòng thi ảo", "Chuẩn bị thao tác và tâm lý trước kỳ thi."],
              ["03", "Học tập và theo dõi tiến bộ", "Ôn kiến thức, luyện từ vựng và nhìn lại kết quả."],
            ].map(([number, title, description]) => (
              <article className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4" key={number}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ice-gold/10 text-xs font-bold text-ice-gold ring-1 ring-ice-gold/20">{number}</span>
                <div>
                  <h3 className="text-sm font-bold text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Innovative · Creative · Effective</p>
        </div>
      </section>
    </main>
  );
}
