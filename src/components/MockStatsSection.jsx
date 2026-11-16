import { useEffect, useMemo, useRef, useState } from "react";
import {
  getApiErrorMessage,
  getMockExams,
  getMockExamOverview,
  getMockExamQuestionStats,
  getMockExamTop,
} from "../services/api";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { formatDuration, formatPercent, formatScore } from "../utils/mockStats";

const PAGE_SIZE = 10;
const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102b5c]";
const SURFACE =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,43,92,0.05)]";

const TOP_OPTIONS = [
  { value: 5, label: "Top 5" },
  { value: 10, label: "Top 10" },
  { value: 20, label: "Top 20" },
  { value: 50, label: "Top 50" },
  { value: 100, label: "Toàn bộ" },
];
const SORT_OPTIONS = [
  { value: "order", label: "Theo thứ tự" },
  { value: "hardest", label: "Khó nhất trước" },
];
const RANK_STYLES = {
  1: "bg-amber-400 text-amber-950",
  2: "bg-slate-300 text-slate-800",
  3: "bg-orange-300 text-orange-950",
};

/* ───────── Helpers ───────── */

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : null;
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("vi-VN") : "—";
// Giả định API trả phần trăm theo thang 0–100.
const pct = (value) => Math.min(100, Math.max(0, Number(value) || 0));

function initials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (
    parts.length === 1
      ? parts[0][0]
      : parts[parts.length - 2][0] + parts[parts.length - 1][0]
  ).toUpperCase();
}

function getDifficulty(correctPercent) {
  const value = pct(correctPercent);
  if (value >= 70)
    return {
      label: "Dễ",
      className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    };
  if (value >= 40)
    return {
      label: "Trung bình",
      className: "bg-amber-50 text-amber-800 ring-amber-200",
    };
  return { label: "Khó", className: "bg-rose-50 text-rose-800 ring-rose-200" };
}

/**
 * Tải dữ liệu bất đồng bộ: giữ dữ liệu cũ khi đang tải trang mới (không nháy giao diện),
 * mỗi khối có lỗi và nút "Thử lại" riêng.
 */
function useAsync(fetcher, key, fallbackMessage) {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState({ key: null, data: null, error: "" });
  const fetcherRef = useRef(fetcher);
  const fullKey = `${key}#${nonce}`;

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let active = true;
    fetcherRef
      .current()
      .then((data) => {
        if (active) setState({ key: fullKey, data, error: "" });
      })
      .catch((error) => {
        if (active) {
          setState((prev) => ({
            key: fullKey,
            data: prev.data,
            error: getApiErrorMessage(error, fallbackMessage),
          }));
        }
      });
    return () => {
      active = false;
    };
  }, [fullKey, fallbackMessage]);

  return {
    data: state.data,
    error: state.key === fullKey ? state.error : "",
    loading: state.key !== fullKey,
    reload: () => setNonce((n) => n + 1),
  };
}

/* ───────── Primitives ───────── */

const ICONS = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </>
  ),
  chevron: <path d="m9 6 6 6-6 6" />,
  back: <path d="m15 6-6 6 6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </>
  ),
  file: (
    <>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5M10 13h6M10 17h6" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
};

function Icon({ name, className = "h-4 w-4" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {ICONS[name]}
    </svg>
  );
}

function Skeleton({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded-md bg-current opacity-10 motion-safe:animate-pulse ${className}`}
    />
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      <span className="font-medium">{message}</span>
      {onRetry && (
        <button
          className={`shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-red-200 transition hover:bg-red-100 ${FOCUS}`}
          onClick={onRetry}
          type="button"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}

function Segmented({ label, value, onChange, options }) {
  return (
    <div
      aria-label={label}
      className="inline-flex w-fit rounded-xl bg-slate-100 p-1"
      role="group"
    >
      {options.map((option) => (
        <button
          aria-pressed={option.value === value}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${FOCUS} ${option.value === value ? "bg-white text-[#102b5c] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Panel({ id, title, description, action, children }) {
  return (
    <section aria-labelledby={id} className={`overflow-hidden ${SURFACE}`}>
      <header className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <h2
            className="font-gf text-xl font-extrabold tracking-tight text-[#102b5c]"
            id={id}
          >
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function Meta({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-slate-400" name={icon} />
      {children}
    </span>
  );
}

function PageButton({ children, ...props }) {
  return (
    <button
      className={`rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-[#102b5c]/30 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

/* ───────── Danh sách đề thi ───────── */

function ListSkeleton() {
  return (
    <ul aria-hidden="true" className="divide-y divide-slate-100">
      {[0, 1, 2, 3].map((i) => (
        <li className="flex items-center gap-4 px-6 py-5" key={i}>
          <Skeleton className="hidden h-11 w-11 rounded-xl sm:block" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3.5 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MockStatsSection() {
  const [keywordInput, setKeywordInput] = useState("");
  const keyword = useDebouncedValue(keywordInput.trim());
  const [pageState, setPageState] = useState({ keyword: "", page: 0 });
  const [selected, setSelected] = useState(null);

  // Trang gắn với từ khóa: đổi từ khóa thì tự về trang đầu, không gọi API thừa.
  const page = pageState.keyword === keyword ? pageState.page : 0;
  const setPage = (next) => setPageState({ keyword, page: next });

  const {
    data: list,
    error,
    loading,
    reload,
  } = useAsync(
    () =>
      getMockExams({
        page,
        size: PAGE_SIZE,
        keyword,
        status: "PUBLISHED",
      }).then((result) => ({
        ...result,
        items: result.items.map((exam) => ({ ...exam, examId: exam.id })),
      })),
    `${page}|${keyword}`,
    "Không tải được danh sách đề thi thử.",
  );

  if (selected) {
    return (
      <MockExamDetail
        exam={selected}
        key={selected.examId}
        onBack={() => setSelected(null)}
      />
    );
  }

  const items = list?.items || [];
  const totalPages = list?.totalPages || 0;
  const totalItems = list?.totalElements ?? items.length;

  return (
    <section aria-labelledby="mock-stats-title" className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            className="font-gf text-3xl font-extrabold tracking-tight text-[#102b5c] sm:text-4xl"
            id="mock-stats-title"
          >
            Thống kê thi thử
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Chọn một đề để xem kết quả tổng quan, bảng xếp hạng và phân tích
            từng câu hỏi của học sinh.
          </p>
        </div>
        <p aria-live="polite" className="text-sm text-slate-500">
          {list ? (
            <>
              <strong className="font-extrabold tabular-nums text-[#102b5c]">
                {totalItems}
              </strong>{" "}
              đề đã công bố
            </>
          ) : (
            "Đang đồng bộ dữ liệu…"
          )}
        </p>
      </header>

      <div className={`overflow-hidden ${SURFACE}`}>
        <div className="border-b border-slate-200 p-3 sm:p-4">
          <div className="relative">
            <Icon
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              name="search"
            />
            <input
              aria-label="Tìm theo tên đề"
              className="h-11 w-full rounded-xl border border-transparent bg-slate-50 pl-11 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#102b5c]/25 focus:bg-white focus:ring-4 focus:ring-[#102b5c]/10"
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="Tìm theo tên đề thi"
              type="search"
              value={keywordInput}
            />
            {keywordInput && (
              <button
                aria-label="Xóa từ khóa"
                className={`absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 ${FOCUS}`}
                onClick={() => setKeywordInput("")}
                type="button"
              >
                <Icon className="h-3.5 w-3.5" name="close" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4">
            <ErrorBanner message={error} onRetry={reload} />
          </div>
        )}

        {!list && !error && (
          <>
            <span className="sr-only" role="status">
              Đang tải danh sách đề thi…
            </span>
            <ListSkeleton />
          </>
        )}

        {list && items.length === 0 && (
          <div className="px-6 py-14 text-center">
            <span
              aria-hidden="true"
              className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#102b5c]/[0.06] text-[#102b5c]"
            >
              <Icon className="h-6 w-6" name="file" />
            </span>
            <h3 className="mt-4 font-gf text-lg font-bold text-[#102b5c]">
              {keyword
                ? "Không có đề nào khớp từ khóa"
                : "Chưa có đề thi được công bố"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {keyword
                ? "Thử từ khóa ngắn hơn hoặc xóa từ khóa để xem tất cả đề."
                : "Đề thi sẽ xuất hiện ở đây sau khi được công bố."}
            </p>
            {keyword && (
              <button
                className={`mt-5 rounded-lg bg-[#102b5c] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#174783] ${FOCUS}`}
                onClick={() => setKeywordInput("")}
                type="button"
              >
                Xóa từ khóa
              </button>
            )}
          </div>
        )}

        {items.length > 0 && (
          <ul
            className={`divide-y divide-slate-100 transition-opacity ${loading ? "opacity-50" : ""}`}
          >
            {items.map((exam) => (
              <li key={exam.examId}>
                <button
                  className={`group relative flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-slate-50 sm:px-6 sm:py-5 ${FOCUS} focus-visible:-outline-offset-2`}
                  onClick={() => {
                    setSelected(exam);
                    window.scrollTo({ top: 0 });
                  }}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-amber-500 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  />
                  <span
                    aria-hidden="true"
                    className="hidden h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#102b5c]/[0.06] text-[#102b5c] sm:grid"
                  >
                    <Icon className="h-5 w-5" name="file" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-gf text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#102b5c]">
                      {exam.title}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                      <Meta icon="list">
                        {exam.totalQuestions ?? "—"} câu hỏi
                      </Meta>
                      <Meta icon="clock">
                        {exam.durationMinutes ?? "—"} phút
                      </Meta>
                      {formatDate(exam.createdAt) && (
                        <Meta icon="calendar">
                          {formatDate(exam.createdAt)}
                        </Meta>
                      )}
                    </span>
                  </span>
                  <span className="hidden text-sm font-semibold text-[#102b5c] sm:inline">
                    Xem thống kê
                  </span>
                  <Icon
                    className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#102b5c] motion-reduce:transition-none"
                    name="chevron"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <nav
            aria-label="Phân trang đề thi"
            className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-6"
          >
            <span
              aria-live="polite"
              className="text-xs font-medium text-slate-500"
            >
              {loading ? (
                "Đang cập nhật…"
              ) : (
                <>
                  Trang <strong className="text-[#102b5c]">{page + 1}</strong> /{" "}
                  {totalPages}
                </>
              )}
            </span>
            <div className="flex gap-2">
              <PageButton
                disabled={page === 0 || loading}
                onClick={() => setPage(page - 1)}
              >
                Trước
              </PageButton>
              <PageButton
                disabled={page + 1 >= totalPages || loading}
                onClick={() => setPage(page + 1)}
              >
                Sau
              </PageButton>
            </div>
          </nav>
        )}
      </div>
    </section>
  );
}

/* ───────── Chi tiết một đề ───────── */

function HeroStat({ label, detail, value, ready, featured = false }) {
  return (
    <div
      className={`bg-[#102b5c] px-5 py-4 sm:px-6 sm:py-5 ${featured ? "col-span-2 lg:col-span-1" : ""}`}
    >
      <dt className="text-xs font-medium text-slate-300">{label}</dt>
      <dd
        className={`mt-1.5 font-gf font-extrabold tabular-nums ${featured ? "text-3xl text-amber-300 sm:text-4xl" : "text-2xl sm:text-3xl"}`}
      >
        {ready ? value : <Skeleton className="h-8 w-20" />}
      </dd>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

function ScoreHistogram({ distribution }) {
  const maxCount = Math.max(1, ...distribution.map((bucket) => bucket.count));
  const peak = distribution.reduce(
    (best, bucket) => (bucket.count > best.count ? bucket : best),
    distribution[0],
  );

  return (
    <div className="px-5 pb-6 pt-4 sm:px-7">
      <ul className="flex items-end gap-1.5 sm:gap-3">
        {distribution.map((bucket) => (
          <li
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
            key={bucket.label}
          >
            <span className="sr-only">
              {bucket.label}: {bucket.count} học sinh,{" "}
              {formatPercent(bucket.percent)}
            </span>
            <div aria-hidden="true" className="flex h-48 w-full items-end pt-6">
              <div
                className={`relative w-full rounded-t-md motion-safe:transition-[height] motion-safe:duration-500 ${bucket === peak ? "bg-[#102b5c]" : "bg-[#102b5c]/25"}`}
                style={{
                  height: `${bucket.count ? Math.max(3, (bucket.count / maxCount) * 100) : 0}%`,
                }}
              >
                <span
                  className={`absolute inset-x-0 -top-5 text-center text-xs font-bold tabular-nums ${bucket.count ? "text-slate-700" : "text-slate-300"}`}
                >
                  {bucket.count}
                </span>
              </div>
            </div>
            <span
              aria-hidden="true"
              className="border-t border-slate-200 pt-2 text-[11px] font-semibold tabular-nums text-slate-600 sm:text-xs"
            >
              {bucket.label}
            </span>
            <span
              aria-hidden="true"
              className="hidden text-[11px] tabular-nums text-slate-400 sm:block"
            >
              {formatPercent(bucket.percent)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OptionStats({ question }) {
  const options = question.optionStats || [];
  const trap = options
    .filter((option) => !option.correct)
    .reduce(
      (best, option) =>
        pct(option.percent) > pct(best?.percent ?? -1) ? option : best,
      null,
    );
  const trapOption = trap && pct(trap.percent) >= 10 ? trap.option : null;

  return (
    <>
      <ul className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2">
        {options.map((option) => {
          const isTrap = option.option === trapOption;
          const tone = option.correct
            ? {
                border: "border-emerald-200",
                fill: "bg-emerald-100",
                text: "text-emerald-800",
              }
            : isTrap
              ? {
                  border: "border-rose-200",
                  fill: "bg-rose-100",
                  text: "text-rose-800",
                }
              : {
                  border: "border-slate-200",
                  fill: "bg-slate-100",
                  text: "text-slate-700",
                };
          return (
            <li
              className={`relative overflow-hidden rounded-lg border bg-white px-3 py-2 text-sm ${tone.border}`}
              key={option.option}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-y-0 left-0 ${tone.fill}`}
                style={{ width: `${pct(option.percent)}%` }}
              />
              <span className="relative flex items-center justify-between gap-2">
                <span className={`font-extrabold ${tone.text}`}>
                  {option.option}
                </span>
                <span className="font-semibold tabular-nums text-slate-600">
                  {formatPercent(option.percent)}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      {trapOption && (
        <p className="mt-2 text-xs text-rose-700">
          Nhiều học sinh chọn nhầm đáp án {trapOption} nhất.
        </p>
      )}
    </>
  );
}

function QuestionRow({ question, hasData }) {
  const level = getDifficulty(question.correctPercent);
  const correct = pct(question.correctPercent);
  const wrong = pct(question.wrongPercent);

  return (
    <li className="px-5 py-5 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="font-gf text-lg font-extrabold text-[#102b5c]">
            Câu {question.questionNumber}
          </span>
          {question.partName && (
            <span className="text-sm text-slate-500">{question.partName}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          {hasData && (
            <span
              className={`rounded-full px-2.5 py-1 ring-1 ${level.className}`}
            >
              {level.label}
            </span>
          )}
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 ring-1 ring-emerald-200">
            Đáp án {question.correctOpt}
          </span>
        </div>
      </div>

      <div
        aria-label={`Đúng ${formatPercent(question.correctPercent)}, sai ${formatPercent(question.wrongPercent)}`}
        className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-100"
        role="img"
      >
        <div className="bg-emerald-500" style={{ width: `${correct}%` }} />
        <div className="bg-rose-400" style={{ width: `${wrong}%` }} />
      </div>
      <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold">
        <span className="text-emerald-700">
          Đúng {formatPercent(question.correctPercent)}
        </span>
        <span className="text-rose-700">
          Sai {formatPercent(question.wrongPercent)}
        </span>
        <span className="text-slate-500">
          {question.unansweredCount} học sinh bỏ trống
        </span>
      </p>

      <OptionStats question={question} />
    </li>
  );
}

function MockExamDetail({ exam, onBack }) {
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState("order");

  const overview = useAsync(
    () => getMockExamOverview(exam.examId),
    `overview|${exam.examId}`,
    "Không tải được tổng quan kết quả.",
  );
  const questions = useAsync(
    () => getMockExamQuestionStats(exam.examId),
    `questions|${exam.examId}`,
    "Không tải được thống kê từng câu.",
  );
  const top = useAsync(
    () => getMockExamTop(exam.examId, limit),
    `top|${exam.examId}|${limit}`,
    "Không tải được bảng xếp hạng.",
  );

  const summary = overview.data;
  const distribution = summary?.scoreDistribution || [];
  const noSubmissions = Boolean(summary) && summary.submittedCount === 0;
  const hasData = Boolean(summary) && !noSubmissions;
  const peak = distribution.reduce(
    (best, bucket) => (!best || bucket.count > best.count ? bucket : best),
    null,
  );

  const questionList = useMemo(() => {
    const rows = [...(questions.data?.questions || [])];
    if (sort === "hardest")
      rows.sort((a, b) => pct(a.correctPercent) - pct(b.correctPercent));
    return rows;
  }, [questions.data, sort]);

  const hardest = useMemo(() => {
    const rows = questions.data?.questions || [];
    return rows.reduce(
      (worst, row) =>
        !worst || pct(row.correctPercent) < pct(worst.correctPercent)
          ? row
          : worst,
      null,
    );
  }, [questions.data]);

  return (
    <section aria-labelledby="mock-exam-detail-title" className="space-y-6">
      <button
        className={`inline-flex items-center gap-1.5 rounded-lg py-1.5 pr-3 text-sm font-semibold text-slate-600 transition hover:text-[#102b5c] ${FOCUS}`}
        onClick={onBack}
        type="button"
      >
        <Icon className="h-4 w-4" name="back" />
        Danh sách đề thi
      </button>

      <header className="overflow-hidden rounded-2xl bg-[#102b5c] text-white shadow-[0_18px_40px_-28px_rgba(7,21,46,0.8)]">
        <div className="p-6 sm:p-8">
          <h1
            className="font-gf text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl"
            id="mock-exam-detail-title"
          >
            {exam.title}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Phân tích kết quả, thứ hạng và độ khó của từng câu hỏi.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-200">
            <span className="inline-flex items-center gap-1.5">
              <Icon className="h-4 w-4 text-slate-400" name="list" />
              {exam.totalQuestions ?? "—"} câu hỏi
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon className="h-4 w-4 text-slate-400" name="clock" />
              {exam.durationMinutes ?? "—"} phút
            </span>
          </div>
        </div>
        <dl
          aria-label="Tổng quan kết quả"
          className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 lg:grid-cols-4"
        >
          <HeroStat
            detail="Thang điểm 10"
            featured
            label="Điểm trung bình"
            ready={Boolean(summary)}
            value={formatScore(summary?.averageScore)}
          />
          <HeroStat
            detail="Toàn bộ lượt nộp"
            label="Bài nộp"
            ready={Boolean(summary)}
            value={summary?.submittedCount}
          />
          <HeroStat
            detail="Học sinh cao nhất"
            label="Điểm cao nhất"
            ready={Boolean(summary)}
            value={formatScore(summary?.highestScore)}
          />

          <HeroStat
            detail="Trung bình mỗi lượt"
            label="Thời gian làm bài"
            ready={Boolean(summary)}
            value={formatDuration(summary?.averageDurationSeconds)}
          />
        </dl>
      </header>

      {overview.error && (
        <ErrorBanner message={overview.error} onRetry={overview.reload} />
      )}

      {noSubmissions && (
        <p
          className={`${SURFACE} px-5 py-4 text-sm font-medium text-slate-600`}
          role="status"
        >
          Đề thi này chưa có học sinh nộp bài. Thống kê sẽ xuất hiện khi có kết
          quả đầu tiên.
        </p>
      )}

      {hasData && distribution.length > 0 && (
        <Panel
          action={
            peak && (
              <p className="text-sm text-slate-500">
                Đông nhất:{" "}
                <strong className="font-bold text-[#102b5c]">
                  {peak.label}
                </strong>{" "}
                ({peak.count} học sinh)
              </p>
            )
          }
          description="Số học sinh theo từng khoảng điểm."
          id="score-distribution-title"
          title="Phân bố điểm"
        >
          <ScoreHistogram distribution={distribution} />
        </Panel>
      )}

      <Panel
        action={
          <Segmented
            label="Số thứ hạng hiển thị"
            onChange={setLimit}
            options={TOP_OPTIONS}
            value={limit}
          />
        }
        description="Điểm số và thời gian hoàn thành của học sinh."
        id="leaderboard-title"
        title="Bảng xếp hạng"
      >
        {top.error && (
          <div className="p-4 sm:p-5">
            <ErrorBanner message={top.error} onRetry={top.reload} />
          </div>
        )}
        {!top.data && !top.error && (
          <div aria-hidden="true" className="space-y-3 p-5 sm:p-7">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton className="h-9 w-full" key={i} />
            ))}
          </div>
        )}
        {top.data && top.data.items.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Chưa có học sinh trong bảng xếp hạng.
          </p>
        )}
        {top.data && top.data.items.length > 0 && (
          <div
            className={`overflow-x-auto transition-opacity ${top.loading ? "opacity-50" : ""}`}
          >
            <table className="w-full min-w-[680px] text-left text-sm">
              <caption className="sr-only">
                Bảng xếp hạng học sinh có điểm cao nhất
              </caption>
              <thead className="bg-slate-50/70 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="py-3 pl-5 pr-3 sm:pl-7" scope="col">
                    Hạng
                  </th>
                  <th className="px-3 py-3" scope="col">
                    Học sinh
                  </th>
                  <th className="px-3 py-3 text-right" scope="col">
                    Điểm
                  </th>
                  <th className="px-3 py-3 text-right" scope="col">
                    Câu đúng
                  </th>
                  <th className="px-3 py-3 text-right" scope="col">
                    Thời gian
                  </th>
                  <th className="py-3 pl-3 pr-5 sm:pr-7" scope="col">
                    Nộp lúc
                  </th>
                </tr>
              </thead>
              <tbody>
                {top.data.items.map((item) => (
                  <tr
                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                    key={item.submissionId}
                  >
                    <td className="py-3 pl-5 pr-3 sm:pl-7">
                      <span
                        className={`inline-grid h-8 min-w-8 place-items-center rounded-full px-2 text-xs font-extrabold tabular-nums ${RANK_STYLES[item.rank] ?? "bg-slate-100 text-slate-500"}`}
                      >
                        {item.rank}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#102b5c]/[0.07] text-xs font-bold text-[#102b5c]"
                        >
                          {initials(item.fullName)}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {item.fullName || "Ẩn danh"}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-gf text-base font-extrabold tabular-nums text-[#102b5c]">
                      {formatScore(item.score)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-600">
                      {item.correctCount}/{item.totalQuestions}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-600">
                      {formatDuration(item.durationSeconds)}
                    </td>
                    <td className="py-3 pl-3 pr-5 text-xs tabular-nums text-slate-500 sm:pr-7">
                      {formatDateTime(item.submittedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        action={
          <Segmented
            label="Sắp xếp câu hỏi"
            onChange={setSort}
            options={SORT_OPTIONS}
            value={sort}
          />
        }
        description={
          hasData && hardest
            ? `Câu khó nhất là câu ${hardest.questionNumber}, chỉ ${formatPercent(hardest.correctPercent)} học sinh làm đúng.`
            : "Đối chiếu đáp án, tỉ lệ đúng sai và lựa chọn của học sinh."
        }
        id="question-stats-title"
        title="Kết quả theo từng câu"
      >
        {questions.error && (
          <div className="p-4 sm:p-5">
            <ErrorBanner message={questions.error} onRetry={questions.reload} />
          </div>
        )}
        {!questions.data && !questions.error && (
          <div aria-hidden="true" className="space-y-5 p-5 sm:p-7">
            {[0, 1, 2].map((i) => (
              <Skeleton className="h-20 w-full" key={i} />
            ))}
          </div>
        )}
        {questions.data && questionList.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Chưa có dữ liệu phân tích câu hỏi.
          </p>
        )}
        {questionList.length > 0 && (
          <ol className="divide-y divide-slate-100">
            {questionList.map((question) => (
              <QuestionRow
                hasData={hasData}
                key={question.questionId}
                question={question}
              />
            ))}
          </ol>
        )}
      </Panel>
    </section>
  );
}
