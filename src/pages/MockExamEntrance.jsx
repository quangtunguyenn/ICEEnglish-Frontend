import { useEffect, useState, useSyncExternalStore } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  getApiErrorMessage,
  getAuthProfile,
  getGuestExams,
  getMockExams,
} from "../services/api";
import {
  getMockLoginError,
  guestMockProfile,
} from "../utils/mockExamCredentials";

function subscribeAuth(callback) {
  window.addEventListener("iceenglish:auth-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("iceenglish:auth-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getToken() {
  return typeof localStorage === "undefined"
    ? null
    : localStorage.getItem("accessToken");
}

async function findExamTitle(examId, guest) {
  if (guest) {
    const exams = await getGuestExams("MOCK");
    if (!Array.isArray(exams))
      throw new Error("Dữ liệu danh sách đề thi không hợp lệ.");
    const exam = exams.find((item) => String(item.id) === examId);
    if (!exam) throw new Error("Không tìm thấy đề thi thử đã chọn.");
    return exam.title || exam.name || "Đề thi thử";
  }
  let page = 0;
  let totalPages = 1;
  while (page < totalPages && page < 200) {
    const result = await getMockExams({ page, size: 100 });
    if (!Array.isArray(result?.items))
      throw new Error("Dữ liệu danh sách đề thi không hợp lệ.");
    const exam = result.items.find((item) => String(item.id) === examId);
    if (exam) return exam.title || exam.name || "Đề thi thử";
    totalPages = Number(result.totalPages) || 0;
    page += 1;
  }
  throw new Error("Không tìm thấy đề thi thử đã chọn.");
}

function genderLabel(gender) {
  if (typeof gender !== "string" || !gender.trim()) return "Chưa cập nhật";
  const value = gender.trim().toUpperCase();
  if (value === "MALE") return "Nam";
  if (value === "FEMALE") return "Nữ";
  if (value === "OTHER") return "Khác";
  return gender;
}

// Ngày sinh từ API thường ở dạng yyyy-mm-dd, hiển thị theo thói quen Việt Nam: dd/mm/yyyy.
function formatDob(dob) {
  if (typeof dob !== "string" || !dob.trim()) return "";
  const match = dob.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : dob;
}

export function MockExamEntrance() {
  const { examId } = useParams();
  const token = useSyncExternalStore(subscribeAuth, getToken, getToken);
  return (
    <EntranceContent
      key={`${examId}:${token || "guest"}`}
      examId={examId}
      guest={!token}
    />
  );
}

function EntranceContent({ examId, guest }) {
  const location = useLocation();
  const navigate = useNavigate();
  const initialTitle =
    typeof location.state?.examTitle === "string"
      ? location.state.examTitle.trim()
      : "";
  const [title, setTitle] = useState(initialTitle);
  const [titleError, setTitleError] = useState("");
  const [profile, setProfile] = useState(guest ? guestMockProfile : null);
  const [profileError, setProfileError] = useState("");
  const [retry, setRetry] = useState(0);
  const [studentIrn, setStudentIrn] = useState(
    guest ? guestMockProfile.studentIrn : "",
  );
  const [password, setPassword] = useState(
    guest ? guestMockProfile.passwordMock : "",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (initialTitle) return;
    let active = true;
    findExamTitle(examId, guest)
      .then((value) => {
        if (active) setTitle(value);
      })
      .catch((requestError) => {
        if (active)
          setTitleError(
            getApiErrorMessage(requestError, "Không thể tải thông tin đề thi."),
          );
      });
    return () => {
      active = false;
    };
  }, [examId, guest, initialTitle, retry]);

  useEffect(() => {
    if (guest) return;
    let active = true;
    getAuthProfile()
      .then((value) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          throw new Error("Hồ sơ học sinh không hợp lệ. Vui lòng thử lại.");
        }
        if (active) setProfile(value);
      })
      .catch((requestError) => {
        if (active)
          setProfileError(
            getApiErrorMessage(requestError, "Không thể tải hồ sơ học sinh."),
          );
      });
    return () => {
      active = false;
    };
  }, [guest, retry]);

  function retryLoading() {
    setTitleError("");
    setProfileError("");
    setRetry((value) => value + 1);
  }

  // Sửa ô nhập thì xóa thông báo lỗi đăng nhập cũ để không gây hiểu nhầm.
  function handleField(setter) {
    return (event) => {
      setter(event.target.value);
      if (error) setError("");
    };
  }

  function handleLogin(event) {
    event.preventDefault();
    if (!profile || !title) return;
    const loginError = getMockLoginError(profile, studentIrn, password);
    if (loginError) {
      setError(loginError);
      return;
    }
    setError("");
    setSignedIn(true);
  }

  const loading = !title || !profile;
  const loadError = titleError || profileError;
  const fieldBase =
    "block w-full min-w-0 rounded-md border border-slate-300 px-3 py-2.5 !font-gf text-[16px] !font-normal text-slate-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200";
  const fieldClass = `${fieldBase} bg-white`;
  const readOnlyClass = `${fieldBase} mt-2 bg-slate-50`;
  const actionClass =
    "inline-flex font-gf text-[18px] items-center justify-center rounded-md bg-[#2042b6] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#17348f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

  if (signedIn) {
    return (
      <section className="min-h-dvh bg-[#edf5ff] px-4 py-10 font-sans sm:px-8 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <h1 className="mt-3 text-center font-gf text-xl font-bold text-[#1e3c8d] sm:text-2xl">
            KỲ THI TỐT NGHIỆP THPT 2027
          </h1>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <section className="rounded-lg bg-white p-5 shadow-[0_3px_12px_rgba(15,35,75,0.12)]">
              <h2 className="text-lg font-gf font-bold text-[#1e3c8d]">
                THÔNG TIN THÍ SINH
              </h2>
              <dl className="mt-4 font-p grid gap-3 text-[16px] text-slate-700 sm:grid-cols-2">
                <Info label="Họ và tên" value={profile.fullName} />
                <Info label="SBD" value={profile.studentIrn} />
                <Info label="Ngày sinh" value={formatDob(profile.dob)} />
                <Info label="Giới tính" value={genderLabel(profile.gender)} />
              </dl>
            </section>
            <section className="rounded-lg bg-white p-5 shadow-[0_3px_12px_rgba(15,35,75,0.12)]">
              <h2 className="text-lg font-gf font-bold text-[#1e3c8d]">
                HỘI ĐỒNG THI
              </h2>
              <dl className="mt-4 font-p text-[16px] grid gap-3  text-slate-700">
                <Info label="Hội đồng thi" value="ICE English" />
                <Info label="Điểm thi" value="ICE English Website" />
                <Info label="Phòng thi" value="Online" />
              </dl>
            </section>
          </div>
          <section className="mt-4 rounded-lg bg-white p-5 shadow-[0_3px_12px_rgba(15,35,75,0.08)]">
            <h2 className="border-b border-slate-100 pb-4 text-lg font-gf font-bold text-slate-800">
              DANH SÁCH MÔN THI
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Lặp qua danh sách các môn thi ở đây. Ví dụ 1 item: */}
              <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-1">
                <div className="min-w-0">
                  <p className="font-gf text-sm font-bold text-slate-800">
                    Tiếng Anh
                  </p>
                </div>
                <button
                  className={actionClass}
                  onClick={() => navigate(`/thi-thu/${encodeURIComponent(examId)}`)}
                  type="button"
                >
                  Vào thi
                </button>
              </div>

              {/* Các môn thi khác... */}
            </div>
          </section>
          <div className="mt-8 text-center">
            <button
              className="rounded-md border border-blue-700 bg-white px-6 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              onClick={() => {
                setSignedIn(false);
                if (!guest) {
                  setStudentIrn("");
                  setPassword("");
                  setShowPassword(false);
                }
              }}
              type="button"
            >
              Quay lại
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="flex min-h-dvh flex-col items-center bg-[#082866] bg-cover bg-center px-4 py-10 font-sans text-white sm:py-14"
      style={{ backgroundImage: "url('/bg-thithu.png')" }}
    >
      <form
        autoComplete="off"
        className="mt-7 w-full max-w-[500px] rounded-xl border-l-4 border-blue-700 bg-white px-6 py-8 text-slate-800 shadow-2xl sm:px-12"
        onSubmit={handleLogin}
      >
        <header className="mb-7 text-center">
          <img
            alt="ICE English"
            className="mx-auto h-auto w-[min(100%,260px)] object-contain"
            src="/logo.png"
          />
          <p className="mt-4 flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#102b59]"></p>
          <h1 className="mt-4 font-gf text-[24px] font-bold text-[#2042a0]">
            ĐĂNG NHẬP LÀM BÀI THI
          </h1>
        </header>
        <label className="mt-6 block font-google-sans text-[15px] font-medium">
          Mã thí sinh <span className="text-red-600">*</span>
          <span className="relative mt-2 block">
            <FieldIcon
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              name="user"
            />
            <input
              aria-describedby={error ? "mock-login-error" : undefined}
              aria-invalid={Boolean(error)}
              autoComplete="off"
              className={`${fieldClass} pl-10`}
              name="mock-student-irn"
              onChange={handleField(setStudentIrn)}
              required
              value={studentIrn}
            />
          </span>
        </label>
        <div className="mt-8">
          <label
            className="block font-google-sans text-[15px] font-medium"
            htmlFor="mock-password"
          >
            Mật khẩu <span className="text-red-600">*</span>
          </label>
          <span className="relative mt-2 block">
            <FieldIcon
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              name="lock"
            />
            <input
              aria-describedby={error ? "mock-login-error" : undefined}
              aria-invalid={Boolean(error)}
              autoComplete="new-password"
              className={`${fieldClass} pl-10 pr-11`}
              id="mock-password"
              name="mock-practice-password"
              onChange={handleField(setPassword)}
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-3 text-slate-500 transition hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-700"
              onClick={() => setShowPassword(!showPassword)}
              type="button"
            >
              <FieldIcon name={showPassword ? "eyeOff" : "eye"} />
            </button>
          </span>
        </div>
        <label className="mt-8 block font-google-sans text-[15px] font-medium">
          Đợt thi <span className="text-red-600">*</span>
          <input
            className={readOnlyClass}
            readOnly
            value={title || "Đang tải đề thi..."}
          />
        </label>
        {loadError && (
          <div className="mt-4 text-sm text-red-700" role="alert">
            <p>{loadError}</p>
            <button
              className="mt-2 font-semibold underline"
              onClick={retryLoading}
              type="button"
            >
              Thử lại
            </button>
          </div>
        )}
        {error && (
          <p
            className="mt-4 text-sm text-red-700"
            id="mock-login-error"
            role="alert"
          >
            {error}
          </p>
        )}
        <button
          className={`${actionClass} mt-8 mb-18 w-full`}
          disabled={loading || Boolean(loadError)}
          type="submit"
        >
          {loading && !loadError ? "Đang tải thông tin..." : "Đăng nhập"}
        </button>
      </form>
      <Link
        className="mt-6 text-sm font-semibold text-white underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        to="/thi-thu"
      >
        Quay lại danh sách đề
      </Link>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="inline">{label}: </dt>
      <dd className="inline break-words font-semibold text-slate-900">
        {value || "Chưa cập nhật"}
      </dd>
    </div>
  );
}

const FIELD_ICONS = {
  user: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  lock: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
  eye: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
  eyeOff:
    "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88",
};

function FieldIcon({ name, className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-[18px] w-[18px] ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
    >
      <path
        d={FIELD_ICONS[name]}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
