import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ExamSearchForm } from "../components/ExamListControls";
import { BrandPageIntro } from "../components/PageIntro";
import { useGuestMode } from "../hooks/useGuestMode";
import {
  getApiErrorMessage,
  getGeneralExams,
  getGuestExams,
} from "../services/api";

const FETCH_SIZE = 10;
const SKELETON_COUNT = 7;
const PREVIEW_DELAY_MS = 70;
const CLOSE_DELAY_MS = 200;
const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

// Vòng tròn điểm: r = 20 trong viewBox 48
const RING_RADIUS = 20;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const NAVY_COLOR = "#0b2545";
const NAVY_BG = "bg-[color:var(--ice-navy)]";
const NAVY_TEXT = "text-[color:var(--ice-navy)]";
const NAVY_OUTLINE = "focus-visible:outline-[color:var(--ice-navy)]";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  NAVY_OUTLINE;

/*
 * Chuyển động dùng chung. Mỗi keyframe chỉ có trạng thái "from", trạng thái cuối
 * chính là style của phần tử nên khi người dùng bật "giảm chuyển động"
 * (animation: none) giao diện vẫn đúng.
 */
const ICE_CSS = `
@keyframes ice-in { from { opacity: 0; transform: translateY(10px); } }
@keyframes ice-ring { from { stroke-dashoffset: var(--ring-len); } }
@keyframes ice-grow { from { width: 0; } }
.ice-in { animation: ice-in 360ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.ice-ring { animation: ice-ring 900ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both; }
.ice-grow { animation: ice-grow 900ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both; }
@media (prefers-reduced-motion: reduce) {
  .ice-in, .ice-ring, .ice-grow { animation: none; }
}
`;

/* ---------- Dữ liệu & tiện ích ---------- */

function getTitle(exam) {
  return exam.title || exam.name || "Bài luyện đề THPTQG";
}

function parseScore(score) {
  if (score == null || score === "") return null;
  const value = Number(score);
  return Number.isFinite(value) ? value : null;
}

function formatScore(value) {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

// Tìm kiếm không phân biệt hoa thường và dấu: "de 01" khớp "Đề 01".
function foldText(text) {
  return String(text || "")
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

// Màu không phải là kênh duy nhất: luôn đi kèm nhãn chữ.
function getScoreTone(value) {
  if (value >= 8)
    return {
      label: "Rất tốt",
      stroke: "stroke-emerald-700",
      strokeDark: "stroke-emerald-300",
      text: "text-emerald-700",
      textDark: "text-emerald-300",
      fill: "bg-emerald-300",
    };
  if (value >= 5)
    return {
      label: "Đạt",
      stroke: "stroke-amber-700",
      strokeDark: "stroke-amber-300",
      text: "text-amber-700",
      textDark: "text-amber-300",
      fill: "bg-amber-300",
    };
  return {
    label: "Cần ôn thêm",
    stroke: "stroke-rose-700",
    strokeDark: "stroke-rose-300",
    text: "text-rose-700",
    textDark: "text-rose-300",
    fill: "bg-rose-300",
  };
}

// Mốc kế tiếp tính trực tiếp từ điểm gần nhất, không cần thêm dữ liệu từ API.
function getMilestoneText(value) {
  if (value == null) return "Làm bài để mở khóa kết quả đầu tiên của bạn.";
  if (value >= 10) return "Điểm tuyệt đối. Bạn đã chạm mốc cao nhất!";
  if (value >= 8)
    return `Còn ${formatScore(10 - value)} điểm nữa là chạm điểm 10.`;
  if (value >= 5)
    return `Còn ${formatScore(8 - value)} điểm nữa để đạt mốc Rất tốt.`;
  return `Còn ${formatScore(5 - value)} điểm nữa để đạt mốc Đạt.`;
}

// Tải toàn bộ đề: duyệt qua mọi trang của API phân trang.
async function fetchAllGeneralExams() {
  const all = [];
  let page = 0;
  let totalPages = 1;
  while (page < totalPages && page < 200) {
    const result = await getGeneralExams({
      page,
      size: FETCH_SIZE,
      keyword: "",
    });
    all.push(...result.items);
    totalPages = Number(result.totalPages) || 0;
    page += 1;
  }
  return all;
}

/* ---------- Thành phần nhỏ ---------- */

function ExamIcon({ className }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function ScoreRing({ value, large = false, onDark = false }) {
  const attempted = value != null;
  const tone = attempted ? getScoreTone(value) : null;
  const ratio = attempted ? Math.min(Math.max(value / 10, 0), 1) : 0;
  const display = attempted ? formatScore(value) : "–";
  const sizeClass = large ? "h-28 w-28" : "h-11 w-11";
  const arc = onDark ? tone?.strokeDark : tone?.stroke;

  let numberColor = onDark ? "text-white/75" : "text-slate-500";
  if (attempted) numberColor = onDark ? "text-white" : "text-slate-900";

  return (
    <div
      aria-label={
        attempted ? `Điểm gần nhất ${display} trên 10` : "Chưa có điểm"
      }
      className={`relative shrink-0 ${sizeClass}`}
      role="img"
    >
      <svg
        aria-hidden="true"
        className={`${sizeClass} -rotate-90`}
        viewBox="0 0 48 48"
      >
        <circle
          className={onDark ? "stroke-white/25" : "stroke-slate-300"}
          cx="24"
          cy="24"
          fill="none"
          r={RING_RADIUS}
          strokeWidth={large ? 4 : 5}
        />
        {attempted && (
          <circle
            className={`${arc} ${large ? "ice-ring" : ""}`}
            cx="24"
            cy="24"
            fill="none"
            r={RING_RADIUS}
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - ratio)}
            strokeLinecap="round"
            strokeWidth={large ? 4 : 5}
            style={large ? { "--ring-len": String(RING_LENGTH) } : undefined}
          />
        )}
      </svg>
      <span
        aria-hidden="true"
        className={`absolute inset-0 grid place-items-center font-momo font-bold ${
          large ? "text-3xl" : "text-[13px]"
        } ${numberColor}`}
      >
        {display}
      </span>
    </div>
  );
}

// Thanh tiến độ 0–10 với mốc 5 và 8 (chỉ dùng trên nền navy).
function ScoreTrack({ value }) {
  const attempted = value != null;
  const tone = attempted ? getScoreTone(value) : null;
  const ratio = attempted ? Math.min(Math.max(value / 10, 0), 1) : 0;

  return (
    <div aria-hidden="true" className="mt-7">
      <div className="relative h-2 rounded-full bg-white/15">
        <div
          className={`ice-grow h-full rounded-full ${tone ? tone.fill : "bg-white/40"}`}
          style={{ width: `${ratio * 100}%` }}
        />
        {[5, 8].map((tick) => (
          <span
            className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-white/40"
            key={tick}
            style={{ left: `${tick * 10}%` }}
          />
        ))}
      </div>
      <div className="relative mt-1.5 h-4 font-momo text-[11px] text-white/70">
        {[0, 5, 8, 10].map((tick) => (
          <span
            className={`absolute ${
              tick === 0
                ? ""
                : tick === 10
                  ? "-translate-x-full"
                  : "-translate-x-1/2"
            }`}
            key={tick}
            style={{ left: `${tick * 10}%` }}
          >
            {tick}
          </span>
        ))}
      </div>
    </div>
  );
}

const ACTION_BASE =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const ACTION_STYLES = {
  dark: {
    primary:
      "bg-ice-gold text-slate-900 hover:bg-ice-gold-300 hover:text-slate-900 focus-visible:outline-white",
    secondary:
      "border border-white/25 text-white hover:bg-white/10 hover:text-white focus-visible:outline-white",
    disabled: "border border-white/15 text-white/60",
  },
  light: {
    primary:
      "bg-ice-gold text-slate-900 hover:bg-ice-gold-600 hover:text-slate-900 " +
      NAVY_OUTLINE,
    secondary:
      "border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-700 " +
      NAVY_OUTLINE,
    disabled: "border border-slate-200 text-slate-500",
  },
};

function ExamActions({ exam, title, attempted, guest, variant }) {
  const style = ACTION_STYLES[variant];
  const examId = encodeURIComponent(exam.id);

  return (
    <div className="flex flex-col gap-3">
      <>
        <>
          {/* Chỉ giữ lại duy nhất định nghĩa chuyển động, không viết class CSS ở đây nữa */}
          <style>{`
    @keyframes pen-action {
      0% { opacity: 0; transform: translate(16px, -16px) rotate(45deg); }
      15% { opacity: 1; transform: translate(0, 0) rotate(-12deg); }
      30% { opacity: 1; transform: translate(-3px, 3px) rotate(-20deg); }
      45% { opacity: 1; transform: translate(2px, -1px) rotate(-8deg); }
      60% { opacity: 1; transform: translate(-3px, 4px) rotate(-22deg); }
      75% { opacity: 1; transform: translate(1px, -1px) rotate(-10deg); }
      90%, 100% { opacity: 1; transform: translate(0, 0) rotate(-12deg); }
    }
  `}</style>

          <Link
            aria-label={`Vào làm ngay: ${title}`}
            className="group relative inline-flex min-w-[230px] items-center justify-center gap-3 overflow-hidden rounded-full bg-ice-gold px-8 py-3.5 font-momo text-[16px] font-bold text-slate-950 shadow-lg shadow-ice-gold/40 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ice-gold/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ice-gold active:scale-[0.98]"
            to={`/luyen-de/${examId}`}
          >
            {/* Vệt sáng kính lướt qua */}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />

            <span className="relative z-10 font-roboto text-lg tracking-wide">
              Vào làm ngay
            </span>

            {/* KHU VỰC ICON (24x24px) */}
            <div className="relative z-10 h-6 w-6">
              {/* 1. TỜ ĐỀ THI */}
              <svg
                aria-hidden="true"
                className="absolute inset-0 h-6 w-6 transition-transform duration-300 group-hover:scale-[1.05]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                />
              </svg>

              {/* 2. CÂY BÚT - Đã dùng group-hover của Tailwind để gọi trực tiếp animation */}
              <div className="absolute -right-2 -top-1.5 h-5 w-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:[animation:pen-action_1.5s_ease-in-out_infinite]">
                <svg
                  className="h-full w-full origin-bottom-left"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </Link>
        </>
      </>

      {!guest &&
        (attempted ? (
          <Link
            aria-label={`Xem lịch sử luyện tập: ${title}`}
            className={`${ACTION_BASE} py-3 font-inter text-[14px] font-semibold ${style.secondary}`}
            to={`/luyen-de/${examId}/lich-su`}
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            Xem lịch sử luyện tập
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={`${ACTION_BASE} cursor-not-allowed py-3 font-google-sans text-sm font-semibold ${style.disabled}`}
          >
            Chưa có lịch sử luyện tập
          </span>
        ))}
    </div>
  );
}

/* ---------- Bảng chi tiết (desktop) ---------- */

function DetailPanel({
  exam,
  guest,
  open,
  openCount,
  onPointerEnter,
  onPointerLeave,
}) {
  const title = getTitle(exam);
  const value = guest ? null : parseScore(exam.latestScore);
  const attempted = value != null;
  const tone = attempted ? getScoreTone(value) : null;

  return (
    <aside
      aria-label="Chi tiết đề thi"
      className={`relative hidden overflow-hidden rounded-3xl ${NAVY_BG} bg-gradient-to-br from-[#163867] to-[#081a33] p-8 text-white shadow-[0_24px_50px_-25px_rgba(16,43,92,0.7)] lg:sticky lg:top-6 lg:block lg:self-start`}
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
    >
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-4 w-52 opacity-20 mix-blend-screen grayscale invert"
        src="/ice_english_emblem_vector.svg"
      />

      {open ? (
        <div className="ice-in relative" key={`${exam.id}-${openCount}`}>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ice-gold">
            Chi tiết đề
          </p>
          <h2 className="mt-5 line-clamp-3 font-gf text-3xl font-bold leading-tight text-white">
            {title}
          </h2>

          {guest ? (
            <p className="mt-6 text-sm leading-relaxed text-white/85">
              Sẵn sàng thử sức chưa? Bấm “Vào làm ngay” để bắt đầu.
            </p>
          ) : (
            <>
              <div className="mt-8 flex items-center gap-6">
                <ScoreRing large onDark value={value} />
                <div className="min-w-0">
                  <p className="font-roboto text-sm font-semibold text-white/75">
                    Điểm gần nhất
                  </p>
                  <p
                    className={`mt-0.5 font-roboto text-2xl font-bold ${
                      attempted ? tone.textDark : "text-white"
                    }`}
                  >
                    {attempted ? tone.label : "Chưa có điểm"}
                  </p>
                  <p className="mt-2 text-sm font-google-sans leading-snug text-white/85">
                    {getMilestoneText(value)}
                  </p>
                </div>
              </div>
              <ScoreTrack value={value} />
            </>
          )}

          <div className="mt-8">
            <ExamActions
              attempted={attempted}
              exam={exam}
              guest={guest}
              title={title}
              variant="dark"
            />
          </div>
        </div>
      ) : (
        <div className="relative py-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ice-gold">
            Sẵn sàng luyện tập
          </p>
          <h2 className="mt-4 max-w-xs font-gf text-2xl font-bold leading-snug">
            Chọn đề phù hợp với mục tiêu của bạn
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-200">
            Rê chuột hoặc chọn một đề để xem thông tin và bắt đầu luyện tập.
          </p>
        </div>
      )}
    </aside>
  );
}

/* ---------- Dòng đề trong danh sách ---------- */

function ExamRow({
  exam,
  guest,
  active,
  tabStop,
  onPreview,
  onCancelPreview,
  onSelect,
}) {
  const title = getTitle(exam);
  const value = guest ? null : parseScore(exam.latestScore);
  const attempted = value != null;
  const tone = attempted ? getScoreTone(value) : null;

  return (
    <li>
      <div
        className={`relative rounded-2xl border bg-white transition-[border-color,box-shadow] duration-300 ${
          active
            ? "border-ice-gold-300 shadow-[0_12px_30px_-18px_rgba(16,43,92,0.35)]"
            : "border-slate-200/80 hover:border-ice-gold-300"
        }`}
      >
        <button
          aria-current={active ? "true" : undefined}
          className={`relative flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-colors duration-200 ${FOCUS_RING} ${
            active ? "" : "hover:bg-slate-50"
          }`}
          data-exam-row=""
          onBlur={onCancelPreview}
          onClick={() => onSelect(exam.id)}
          onFocus={() => onSelect(exam.id)}
          onMouseEnter={() => onPreview(exam.id)}
          onMouseLeave={onCancelPreview}
          tabIndex={tabStop ? 0 : -1}
          type="button"
        >
          <span
            aria-hidden="true"
            className={`absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-ice-gold transition-transform duration-300 ${
              active ? "scale-y-100" : "scale-y-0"
            }`}
          />

          <span
            className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors duration-300 ${
              active ? `${NAVY_BG} text-white` : `bg-slate-100 ${NAVY_TEXT}`
            }`}
          >
            <ExamIcon className="h-5 w-5" />
            {attempted && (
              <span
                aria-hidden="true"
                className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white"
              >
                <svg
                  className="h-2.5 w-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3.5"
                  />
                </svg>
              </span>
            )}
          </span>

          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 block font-gf text-xl font-bold leading-snug text-slate-900">
              {title}
            </span>
            {!guest && (
              <span
                className={`mt-0.5 block font-lexend text-[13px]  font-semibold ${
                  attempted ? tone.text : "text-slate-500"
                }`}
              >
                {attempted ? tone.label : "Chưa làm"}
              </span>
            )}
          </span>

          {!guest && <ScoreRing value={value} />}
        </button>

        {/* Điện thoại / máy tính bảng: chi tiết mở ngay dưới dòng được chọn */}
        {active && (
          <div className="grid grid-rows-[1fr] lg:hidden">
            <div className="min-h-0 overflow-hidden">
              <div className="space-y-4 px-4 pb-4 pt-1">
                {!guest && (
                  <p className="text-sm leading-snug text-slate-600">
                    {getMilestoneText(value)}
                  </p>
                )}
                <ExamActions
                  attempted={attempted}
                  exam={exam}
                  guest={guest}
                  title={title}
                  variant="light"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

function ListSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
    >
      <div className="space-y-1.5">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <div className="flex items-center gap-4 px-4 py-3.5" key={index}>
            <div className="h-11 w-11 rounded-xl bg-slate-100 motion-safe:animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-slate-100 motion-safe:animate-pulse" />
              <div className="h-3 w-1/4 rounded bg-slate-100 motion-safe:animate-pulse" />
            </div>
            <div className="h-11 w-11 rounded-full bg-slate-100 motion-safe:animate-pulse" />
          </div>
        ))}
      </div>
      <div className="hidden h-[30rem]  bg-slate-100 motion-safe:animate-pulse lg:block" />
    </div>
  );
}

/* ---------- Trang ---------- */

export function PracticePage() {
  const location = useLocation();
  const guest = useGuestMode();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [keywordInput, setKeywordInput] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const regionRef = useRef(null);
  const listRef = useRef(null);
  const previewTimer = useRef(0);
  const closeTimer = useRef(0);
  const openRef = useRef(false);
  const pointerInside = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    const request = guest
      ? getGuestExams("GENERAL_EXAM")
      : fetchAllGeneralExams();

    request
      .then((items) => {
        if (active) setExams(items);
      })
      .catch((requestError) => {
        if (active)
          setError(
            getApiErrorMessage(
              requestError,
              "Không thể tải danh sách bài thi. Vui lòng thử lại.",
            ),
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [guest, retry]);

  useEffect(
    () => () => {
      clearTimeout(previewTimer.current);
      clearTimeout(closeTimer.current);
    },
    [],
  );

  const keyword = keywordInput.trim();
  const visibleExams = useMemo(() => {
    if (!keyword) return exams;
    const needle = foldText(keyword);
    return exams.filter((exam) => foldText(getTitle(exam)).includes(needle));
  }, [exams, keyword]);

  const activeIndex = Math.max(
    0,
    visibleExams.findIndex((exam) => exam.id === activeId),
  );
  const activeExam = visibleExams[activeIndex];

  function openPanel(id) {
    clearTimeout(closeTimer.current);
    setActiveId(id);
    if (!openRef.current) {
      openRef.current = true;
      setPanelOpen(true);
      setOpenCount((count) => count + 1);
    }
  }

  function closePanel() {
    openRef.current = false;
    setPanelOpen(false);
  }

  // Rê chuột có độ trễ ngắn để lướt qua các dòng không làm bảng chi tiết nhấp nháy.
  function previewExam(id) {
    clearTimeout(previewTimer.current);
    if (!isDesktop()) return;
    previewTimer.current = setTimeout(() => {
      if (isDesktop()) openPanel(id);
    }, PREVIEW_DELAY_MS);
  }

  function cancelPreview() {
    clearTimeout(previewTimer.current);
  }

  function selectExam(id) {
    clearTimeout(previewTimer.current);
    openPanel(id);
  }

  // Bảng chi tiết chỉ tồn tại khi con trỏ (hoặc bàn phím) còn ở khu vực đề thi.
  function closeIfIdle() {
    if (!isDesktop()) return;
    const focused = document.activeElement;
    let keyboardInside = false;
    try {
      keyboardInside = Boolean(
        regionRef.current?.contains(focused) &&
        focused.matches(":focus-visible"),
      );
    } catch {
      keyboardInside = false;
    }
    if (pointerInside.current || keyboardInside) return;
    closePanel();
  }

  function scheduleClose() {
    clearTimeout(closeTimer.current);
    if (!isDesktop()) return;
    closeTimer.current = setTimeout(closeIfIdle, CLOSE_DELAY_MS);
  }

  function enterRegion() {
    if (!isDesktop()) return;
    pointerInside.current = true;
    clearTimeout(closeTimer.current);
  }

  function leaveRegion() {
    pointerInside.current = false;
    cancelPreview();
    scheduleClose();
  }

  // Phím mũi tên di chuyển giữa các đề; Tab nhảy thẳng sang bảng chi tiết.
  function handleListKeyDown(event) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const rows = Array.from(
      listRef.current?.querySelectorAll("[data-exam-row]") ?? [],
    );
    const current = rows.indexOf(event.target.closest("[data-exam-row]"));
    if (current === -1) return;
    event.preventDefault();
    const last = rows.length - 1;
    let next = current;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else if (event.key === "ArrowDown") next = Math.min(current + 1, last);
    else next = Math.max(current - 1, 0);
    rows[next]?.focus();
  }

  const attemptedCount = exams.filter(
    (exam) => parseScore(exam.latestScore) != null,
  ).length;
  const showSkeleton = loading && exams.length === 0;
  const showEmpty = !loading && !error && visibleExams.length === 0;
  const showList = !showSkeleton && !error && visibleExams.length > 0;
  const showSummary = !error && exams.length > 0;

  useEffect(() => {
    if (!showList) {
      pointerInside.current = false;
      openRef.current = false;
      setPanelOpen(false);
    }
  }, [showList]);

  return (
    <div
      className="mx-auto max-w-[1400px] px-6 py-16"
      style={{ "--ice-navy": `var(--color-ice-navy, ${NAVY_COLOR})` }}
    >
      <style>{ICE_CSS}</style>

      <BrandPageIntro
        description="Chọn một đề để xem điểm gần nhất, lịch sử luyện tập và vào làm ngay."
        eyebrow="Phòng luyện tập"
        title="LUYỆN ĐỀ"
      />

      {location.state?.submitted && (
        <p
          className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"
          role="status"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M5 13l4 4L19 7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
          </svg>
          Bài làm đã được nộp thành công.
        </p>
      )}

      <ExamSearchForm
        keywordInput={keywordInput}
        onKeywordChange={setKeywordInput}
        student
      />

      {showSummary && (
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
          {!guest && (
            <div className="flex items-center gap-3">
              <div
                aria-hidden="true"
                className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  className="h-full rounded-full bg-emerald-500 transition-[width] duration-700"
                  style={{ width: `${(attemptedCount / exams.length) * 100}%` }}
                />
              </div>
              <p className="text-sm font-medium text-slate-600 font-inter ">
                Bạn đã làm{" "}
                <span className="font-semibold text-slate-900">
                  {attemptedCount}/{exams.length}
                </span>{" "}
                đề
              </p>
            </div>
          )}
        </div>
      )}

      <p aria-live="polite" className="sr-only" role="status">
        {loading ? "Đang tải danh sách bài thi..." : ""}
      </p>

      {error && (
        <div
          className="mb-6 flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button
            className={`rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 ${FOCUS_RING}`}
            onClick={() => setRetry((current) => current + 1)}
            type="button"
          >
            Thử lại
          </button>
        </div>
      )}

      {showEmpty && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <p className="font-semibold text-slate-700">
            {keyword
              ? `Không tìm thấy bài thi nào khớp với “${keyword}”.`
              : "Chưa có bài thi nào được phát hành."}
          </p>
          {keyword && (
            <button
              className={`mt-3 rounded-lg px-3 py-1.5 text-sm font-semibold ${NAVY_TEXT} underline ${FOCUS_RING}`}
              onClick={() => setKeywordInput("")}
              type="button"
            >
              Xóa từ khóa
            </button>
          )}
        </div>
      )}

      {showSkeleton && <ListSkeleton />}

      {showList && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-gf text-lg font-bold text-[#102b5c]">
              Danh sách đề
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Chọn đề để xem chi tiết và bắt đầu.
            </p>
          </div>
          <p className="text-sm font-semibold text-slate-600">
            {visibleExams.length} đề
          </p>
        </div>
      )}

      {showList && (
        <div
          aria-busy={loading}
          className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
          onBlur={scheduleClose}
          ref={regionRef}
        >
          <ul
            aria-label="Danh sách đề thi"
            className="space-y-1.5"
            onKeyDown={handleListKeyDown}
            onMouseEnter={enterRegion}
            onMouseLeave={leaveRegion}
            ref={listRef}
          >
            {visibleExams.map((exam) => (
              <ExamRow
                active={panelOpen && exam.id === activeExam.id}
                exam={exam}
                guest={guest}
                key={exam.id}
                onCancelPreview={cancelPreview}
                onPreview={previewExam}
                onSelect={selectExam}
                tabStop={exam.id === activeExam.id}
              />
            ))}
          </ul>

          <DetailPanel
            exam={activeExam}
            guest={guest}
            onPointerEnter={enterRegion}
            onPointerLeave={leaveRegion}
            open={panelOpen}
            openCount={openCount}
          />
        </div>
      )}
    </div>
  );
}
