import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getApiErrorMessage, getAuthProfile, loginStudent } from "../services/api";

function getUserRole(user) {
  const roles = [user?.role, ...(Array.isArray(user?.authorities) ? user.authorities : [])]
  return roles.map((role) => String(role || '').toUpperCase().replace(/^ROLE_/, ''))
}

function getLoginErrorMessage(error) {
  if (error?.response?.status === 401) return 'Tên đăng nhập hoặc mật khẩu không đúng.'
  if (error?.request && !error.response) {
    return 'Không kết nối được API. Kiểm tra backend và cấu hình mạng rồi thử lại.'
  }
  return getApiErrorMessage(error, 'Không thể đăng nhập. Vui lòng thử lại.')
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

  function updateField(event) {
    const { name, value } = event.target;
    setCredentials((current) => ({ ...current, [name]: value }));
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
      let profile = loginResult?.user || loginResult?.student || null
      if (!profile || !getUserRole(profile).length) {
        try {
          profile = await getAuthProfile()
        } catch (profileError) {
          setError(
            profileError?.request && !profileError.response
              ? 'Đăng nhập thành công nhưng không thể kết nối để xác minh vai trò. Kiểm tra API /auth/profile.'
              : getApiErrorMessage(profileError, 'Đăng nhập thành công nhưng không lấy được thông tin tài khoản.'),
          )
          return
        }
      }

      const roles = getUserRole(profile)
      if (!roles.length) {
        setError('Đăng nhập thành công nhưng server chưa trả về vai trò tài khoản.')
        return
      }
      const isStaff = roles.includes('ADMIN') || roles.includes('TEACHER')
      const requestedPath = location.state?.from?.pathname
      navigate(isStaff ? '/quan-tri' : requestedPath === '/quan-tri' ? '/' : requestedPath || '/', {
        replace: true,
      });
    } catch (requestError) {
      setError(getLoginErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 px-6 py-12">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <Link className="text-xl font-extrabold text-slate-900" to="/">
          ICE<span className="text-cyan-500">English</span>
        </Link>
        <h1 className="mt-10 text-3xl font-extrabold text-slate-900">
          Đăng nhập ICEEnglish
        </h1>
        <p className="mt-2 text-slate-500">
          Đăng nhập để tiếp tục học tập hoặc quản lý nội dung.
        </p>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-700">
            Tên đăng nhập
            <input
              autoComplete="username"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              name="username"
              onChange={updateField}
              placeholder="student1"
              required
              type="text"
              value={credentials.username}
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Mật khẩu
            <input
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              name="password"
              onChange={updateField}
              placeholder="••••••••"
              required
              type="password"
              value={credentials.password}
            />
          </label>
          {error && (
            <p
              aria-live="polite"
              className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </p>
          )}
          <button
            className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </section>
    </main>
  );
}
