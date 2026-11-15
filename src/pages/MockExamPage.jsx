import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ExamSearchForm } from "../components/ExamListControls";
import { BrandPageIntro } from "../components/PageIntro";
import { useGuestMode } from "../hooks/useGuestMode";
import {
  getApiErrorMessage,
  getGuestExams,
  getMockExams,
  getMockReview,
  getMockScores,
} from "../services/api";

const FETCH_SIZE = 100;
const SKELETON_COUNT = 7;
const PREVIEW_DELAY_MS = 70;
const CLOSE_DELAY_MS = 200;
const MAX_LABELLED_POINTS = 8;
const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

const NAVY_COLOR = "#0b2545";
const NAVY_BG = "bg-[color:var(--ice-navy)]";
const NAVY_TEXT = "text-[color:var(--ice-navy)]";
const NAVY_OUTLINE = "focus-visible:outline-[color:var(--ice-navy)]";

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  NAVY_OUTLINE;

// Vòng tròn điểm: r = 20 trong viewBox 48
const RING_RADIUS = 20;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const PANEL_FADE =
  "transition-[opacity,transform,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

/*
 * Chuyển động dùng chung. Mỗi keyframe chỉ có trạng thái "from", trạng thái cuối
 * chính là style của phần tử nên khi người dùng bật "giảm chuyển động"
 * (animation: none) giao diện vẫn đúng.
 */
const ICE_CSS = `
@keyframes ice-in { from { opacity: 0; transform: translateY(10px); } }
@keyframes ice-ring { from { stroke-dashoffset: var(--ring-len); } }
@keyframes ice-grow { from { width: 0; } }
@keyframes mock-pen-action {
  0% { opacity: 0; transform: translate(16px, -16px) rotate(45deg); }
  15% { opacity: 1; transform: translate(0, 0) rotate(-12deg); }
  30% { transform: translate(-3px, 3px) rotate(-20deg); }
  45% { transform: translate(2px, -1px) rotate(-8deg); }
  60% { transform: translate(-3px, 4px) rotate(-22deg); }
  75% { transform: translate(1px, -1px) rotate(-10deg); }
  90%, 100% { opacity: 1; transform: translate(0, 0) rotate(-12deg); }
}
.ice-in { animation: ice-in 360ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.ice-ring { animation: ice-ring 900ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both; }
.ice-grow { animation: ice-grow 900ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both; }
.mock-exam-start:hover .mock-exam-pen { animation: mock-pen-action 1.5s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .ice-in, .ice-ring, .ice-grow, .mock-exam-start:hover .mock-exam-pen { animation: none; }
}
`;

/* ---------- Dữ liệu & tiện ích ---------- */

function getTitle(exam) {
  return exam.title || exam.name || "Đề thi thử";
}

function getDuration(exam) {
  const value = Number(
    exam.durationMinutes || exam.duration || exam.timeLimitMinutes,
  );
  return Number.isFinite(value) && value > 0 ? value : null;
}

function getQuestionCount(exam) {
  const value = Number(exam.totalQuestions || exam.questionCount);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function parseScore(score) {
  if (score == null || score === "") return null;
  const value = Number(score);
  return Number.isFinite(value) ? value : null;
}

function formatScore(value) {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

function formatDate(value, full = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(
    "vi-VN",
    full
      ? { day: "2-digit", month: "2-digit", year: "numeric" }
      : { day: "2-digit", month: "2-digit" },
  ).format(date);
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
      hex: "#6ee7b7",
    };
  if (value >= 5)
    return {
      label: "Đạt",
      stroke: "stroke-amber-700",
      strokeDark: "stroke-amber-300",
      text: "text-amber-700",
      textDark: "text-amber-300",
      fill: "bg-amber-300",
      hex: "#fcd34d",
    };
  return {
    label: "Cần ôn thêm",
    stroke: "stroke-rose-700",
    strokeDark: "stroke-rose-300",
    text: "text-rose-700",
    textDark: "text-rose-300",
    fill: "bg-rose-300",
    hex: "#fda4af",
  };
}

// Mốc kế tiếp tính trực tiếp từ điểm gần nhất, không cần thêm dữ liệu từ API.
function getMilestoneText(value) {
  if (value == null) return "Hoàn thành bài thi thử để xem điểm của bạn.";
  if (value >= 10) return "Điểm tuyệt đối. Bạn đã chạm mốc cao nhất!";
  if (value >= 8)
    return `Còn ${formatScore(10 - value)} điểm nữa là chạm điểm 10.`;
  if (value >= 5)
    return `Còn ${formatScore(8 - value)} điểm nữa để đạt mốc Rất tốt.`;
  return `Còn ${formatScore(5 - value)} điểm nữa để đạt mốc Đạt.`;
}

// Tải toàn bộ đề: duyệt qua mọi trang của API phân trang.
async function fetchAllMockExams() {
  const all = [];
  let page = 0;
  let totalPages = 1;
  while (page < totalPages && page < 200) {
    const result = await getMockExams({ page, size: FETCH_SIZE, keyword: "" });
    all.push(...result.items);
    totalPages = Number(result.totalPages) || 0;
    page += 1;
  }
  return all;
}

function buildChartData(scores) {
  return [...scores]
    .filter((item) => item.score != null && Number.isFinite(Number(item.score)))
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
    .map((item, index) => ({
      index,
      score: Number(item.score),
      examTitle: item.examTitle,
      submittedAt: item.submittedAt,
      dateLabel: formatDate(item.submittedAt),
    }));
}

// Chỉ hiện tối đa vài mốc ngày trên trục X để không bị chồng chữ.
function getTickIndexes(count, max = 6) {
  if (count <= max) return Array.from({ length: count }, (_, index) => index);
  const step = (count - 1) / (max - 1);
  return Array.from({ length: max }, (_, index) => Math.round(index * step));
}

/* ---------- Icon ---------- */

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

function ClockIcon({ className }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
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
  );
}

function ListIcon({ className }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.25"
      />
    </svg>
  );
}

/* ---------- Vòng tròn điểm, thanh tiến độ, họa tiết ---------- */

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

/* ---------- Thao tác ---------- */

const ACTION_BASE =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-momo text-lg font-bold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const ACTION_STYLES = {
  dark: "bg-ice-gold text-slate-900 hover:bg-ice-gold-300 hover:text-slate-900 focus-visible:outline-white",
  light:
    "bg-ice-gold text-slate-900 hover:bg-ice-gold-600 hover:text-slate-900 " +
    NAVY_OUTLINE,
};

// Đề đã thi: chỉ được xem lại (Review). Đề chưa thi: vào phòng thi.
function ExamActions({ exam, title, attempted, reviewing, onReview, variant }) {
  const style = ACTION_STYLES[variant];

  if (attempted) {
    return (
      <button
        aria-label={`Review bài thi: ${title}`}
        className={`${ACTION_BASE} ${style} disabled:cursor-wait disabled:opacity-70`}
        disabled={reviewing}
        onClick={() => onReview(exam.id)}
        type="button"
      >
        {reviewing && (
          <svg
            aria-hidden="true"
            className="h-5 w-5 motion-safe:animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-90"
              d="M21 12a9 9 0 00-9-9"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
        )}
        {reviewing ? "Đang tải..." : "Review bài thi"}
      </button>
    );
  }

  return (
    <>
      {/* Chỉ giữ lại định nghĩa keyframes, KHÔNG viết class CSS (.group:hover...) ở đây nữa */}
      <style>{`
    @keyframes mock-pen-action {
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
        aria-label={`Vào phòng thi: ${title}`}
        className="group relative inline-flex min-w-[230px] w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-ice-gold px-8 py-3.5 font-momo text-[16px] font-bold text-slate-950 shadow-lg shadow-ice-gold/40 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ice-gold/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ice-gold active:scale-[0.98] motion-reduce:transition-none"
        state={{ examTitle: title }}
        to={`/thi-thu/${encodeURIComponent(exam.id)}/vao-phong`}
      >
        {/* Vệt sáng kính lướt qua */}
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-in-out group-hover:translate-x-full" />

        <span className="relative z-10 font-roboto text-lg tracking-wide">
          Vào phòng thi
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

          {/* 2. CÂY BÚT - Gọi animation và opacity trực tiếp bằng utility class của Tailwind */}
          <div className="absolute -right-2 -top-1.5 h-5 w-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:[animation:mock-pen-action_1.5s_ease-in-out_infinite] group-focus-visible:opacity-100 group-focus-visible:[animation:mock-pen-action_1.5s_ease-in-out_infinite]">
            <svg
              className="h-full w-full origin-bottom-left"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
              />
            </svg>
          </div>
        </div>
      </Link>
    </>
  );
}

function ScoreDot({ cx, cy, payload }) {
  if (!Number.isFinite(cx) || !Number.isFinite(cy) || !payload) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={getScoreTone(Number(payload.score)).hex}
      stroke="#102b5c"
      strokeWidth={2}
    />
  );
}

function ScoreTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload || {};
  const score = Number(item.score);
  const tone = getScoreTone(score);

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg">
      <p className="font-bold text-slate-900">
        {item.examTitle || "Bài thi thử"}
      </p>
      <p className="mt-1 text-slate-700">
        Điểm: <strong className="text-slate-900">{formatScore(score)}</strong>{" "}
        <span className={`font-semibold ${tone.text}`}>({tone.label})</span>
      </p>
      <p className="text-slate-500">
        Ngày làm: {formatDate(item.submittedAt, true)}
      </p>
    </div>
  );
}

function StatTile({ label, value, note, noteClass = "text-white/75" }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="font-raleway text-xs font-semibold text-white/75">
        {label}
      </p>
      <p className="mt-1 font-momo text-2xl font-bold leading-none text-white">
        {value}
      </p>
      <p className={`mt-2 text-xs leading-snug ${noteClass}`}>{note}</p>
    </div>
  );
}

function ScoreChart({ data }) {
  const latest = data[data.length - 1];
  const previous = data[data.length - 2];
  const best = data.reduce(
    (top, item) => (item.score > top.score ? item : top),
    data[0],
  );
  const average = data.reduce((sum, item) => sum + item.score, 0) / data.length;
  const delta = previous ? latest.score - previous.score : null;

  let deltaText = "Lần thi đầu tiên";
  let deltaClass = "text-white/75";
  if (delta !== null && delta > 0) {
    deltaText = `Tăng ${formatScore(delta)} so với lần trước`;
    deltaClass = "text-emerald-300";
  } else if (delta !== null && delta < 0) {
    deltaText = `Giảm ${formatScore(Math.abs(delta))} so với lần trước`;
    deltaClass = "text-rose-300";
  } else if (delta === 0) {
    deltaText = "Bằng lần trước";
  }

  const summary = `Biểu đồ điểm thi thử qua ${data.length} lần thi. Gần nhất ${formatScore(
    latest.score,
  )}, cao nhất ${formatScore(best.score)}, trung bình ${formatScore(average)}.`;

  return (
    <>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatTile
          label="Gần nhất"
          note={deltaText}
          noteClass={deltaClass}
          value={formatScore(latest.score)}
        />
        <StatTile
          label="Cao nhất"
          note={`Ngày ${best.dateLabel}`}
          value={formatScore(best.score)}
        />
        <StatTile
          label="Trung bình"
          note={`Qua ${data.length} lần thi`}
          value={formatScore(average)}
        />
      </div>

      <div aria-label={summary} className="mt-6 h-60 w-full" role="img">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart
            data={data}
            margin={{ top: 22, right: 18, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="mock-score-fill" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-ice-gold)"
                  stopOpacity={0.32}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-ice-gold)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="index"
              domain={data.length === 1 ? [-1, 1] : [0, data.length - 1]}
              interval={0}
              padding={{ left: 14, right: 14 }}
              tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
              tickFormatter={(index) => data[index]?.dateLabel ?? ""}
              tickLine={false}
              ticks={getTickIndexes(data.length)}
              type="number"
            />
            <YAxis
              axisLine={false}
              domain={[0, 10]}
              tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 12 }}
              tickLine={false}
              ticks={[0, 5, 8, 10]}
              width={28}
            />
            <ReferenceLine
              label={{
                value: "Rất tốt",
                position: "insideBottomRight",
                fill: "rgba(255,255,255,0.7)",
                fontSize: 11,
              }}
              stroke="rgba(255,255,255,0.35)"
              strokeDasharray="4 4"
              y={8}
            />
            <ReferenceLine
              label={{
                value: "Đạt",
                position: "insideBottomRight",
                fill: "rgba(255,255,255,0.7)",
                fontSize: 11,
              }}
              stroke="rgba(255,255,255,0.35)"
              strokeDasharray="4 4"
              y={5}
            />
            <Tooltip
              content={<ScoreTooltip />}
              cursor={{
                stroke: "rgba(255,255,255,0.35)",
                strokeDasharray: "4 4",
              }}
            />
            <Area
              activeDot={{ r: 8, strokeWidth: 0, fill: "#ffffff" }}
              animationDuration={900}
              animationEasing="ease-out"
              dataKey="score"
              dot={<ScoreDot />}
              fill="url(#mock-score-fill)"
              stroke="var(--color-ice-gold)"
              strokeWidth={3}
              type="monotone"
            >
              {data.length <= MAX_LABELLED_POINTS && (
                <LabelList
                  dataKey="score"
                  fill="#ffffff"
                  fontSize={12}
                  formatter={(value) => formatScore(Number(value))}
                  offset={12}
                  position="top"
                />
              )}
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

/* Trạng thái mặc định của bảng bên phải: tổng quan năng lực. */
function Overview({ guest, scores, loading, error, onRetry }) {
  const data = useMemo(() => buildChartData(scores), [scores]);

  if (guest) {
    return (
      <div className="py-4">
        <h2 className="font-gf text-2xl font-bold leading-tight text-white">
          Chọn một đề để bắt đầu
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/80">
          Rê chuột vào một đề để xem thời gian làm bài, số câu hỏi và vào phòng
          thi.
        </p>
      </div>
    );
  }

  let body;
  if (loading) {
    body = (
      <div aria-hidden="true" className="mt-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((item) => (
            <div
              className="h-24 rounded-2xl bg-white/10 motion-safe:animate-pulse"
              key={item}
            />
          ))}
        </div>
        <div className="h-60 rounded-2xl bg-white/10 motion-safe:animate-pulse" />
      </div>
    );
  } else if (error) {
    body = (
      <div
        className="mt-6 rounded-2xl border border-white/20 p-6 text-center"
        role="alert"
      >
        <p className="text-sm text-white/85">{error}</p>
        <button
          className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          onClick={onRetry}
          type="button"
        >
          Thử lại
        </button>
      </div>
    );
  } else if (data.length === 0) {
    body = (
      <div className="mt-6 rounded-2xl border border-dashed border-white/25 p-8 text-center">
        <p className="font-semibold text-white">Chưa có điểm thi thử nào</p>
        <p className="mt-2 text-sm leading-relaxed text-white/80">
          Hoàn thành một bài thi thử, biểu đồ tiến bộ của bạn sẽ xuất hiện ở
          đây.
        </p>
      </div>
    );
  } else {
    body = <ScoreChart data={data} />;
  }

  return (
    <div>
      <h2 className="font-gf text-2xl font-bold leading-tight text-white">
        Xu hướng năng lực thi thử
      </h2>
      <p className="mt-1 text-sm text-white/75">
        Điểm qua từng lần thi, theo ngày làm bài
      </p>
      {body}
      <p className="mt-5 hidden text-sm text-white/70 lg:block">
        Rê chuột vào một đề để xem chi tiết và vào phòng thi.
      </p>
    </div>
  );
}

/* ---------- Chi tiết một đề ---------- */

function DetailContent({ exam, guest, reviewing, onReview }) {
  const title = getTitle(exam);
  const value = guest ? null : parseScore(exam.latestScore);
  const attempted = value != null;
  const tone = attempted ? getScoreTone(value) : null;
  const duration = getDuration(exam);
  const questions = getQuestionCount(exam);

  return (
    <div>
      <h2 className="mt-5 line-clamp-3 font-gf text-3xl font-bold leading-tight text-white">
        {title}
      </h2>

      <p className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/85">
        <span className="inline-flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-white/70" />
          {duration ? `${duration} phút` : "Chưa rõ thời gian"}
        </span>
        <span className="inline-flex items-center gap-2">
          <ListIcon className="h-4 w-4 text-white/70" />
          {questions ? `${questions} câu hỏi` : "Nhiều câu hỏi"}
        </span>
      </p>

      {guest ? (
        <p className="mt-6 text-sm leading-relaxed text-white/85">
          Thời hạn do máy chủ xác thực. Bấm “Vào phòng thi” để bắt đầu.
        </p>
      ) : (
        <>
          <div className="mt-7 flex items-center gap-6">
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
                {attempted ? tone.label : "Chưa thi"}
              </p>
              <p className="mt-2 text-sm font-google-sans leading-snug text-white/85">
                {getMilestoneText(value)}
              </p>
            </div>
          </div>
          <ScoreTrack value={value} />
        </>
      )}

      <div className="mt-7">
        <ExamActions
          attempted={attempted}
          exam={exam}
          onReview={onReview}
          reviewing={reviewing}
          title={title}
          variant="dark"
        />
      </div>
    </div>
  );
}

/*
 * Bảng bên phải gồm hai lớp xếp chồng cùng một ô lưới:
 * - Tổng quan (biểu đồ): mặc định, và luôn hiển thị trên điện thoại.
 * - Chi tiết đề: hiện khi rê chuột / focus vào một đề (chỉ từ màn hình lg).
 */
function InspectorPanel({
  exam,
  guest,
  open,
  openCount,
  reviewing,
  scores,
  scoresLoading,
  scoresError,
  onRetryScores,
  onReview,
  onPointerEnter,
  onPointerLeave,
}) {
  return (
    <aside
      aria-label="Biểu đồ điểm và chi tiết đề thi"
      className={`relative order-first overflow-hidden rounded-3xl bg-gradient-to-br from-[#163867] to-[#081a33] p-6 text-white shadow-[0_24px_50px_-25px_rgba(16,43,92,0.7)] sm:p-8 lg:sticky lg:top-6 lg:order-none lg:self-start ${NAVY_BG} ${
        guest ? "hidden lg:block" : ""
      }`}
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
    >
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-4 w-52 opacity-20 mix-blend-screen grayscale invert"
        src="/ice_english_emblem_vector.svg"
      />

      <div className="relative grid">
        <div
          className={`col-start-1 row-start-1 min-w-0 ${PANEL_FADE} ${
            open ? "lg:invisible lg:-translate-x-4 lg:opacity-0" : ""
          }`}
        >
          <Overview
            error={scoresError}
            guest={guest}
            loading={scoresLoading}
            onRetry={onRetryScores}
            scores={scores}
          />
        </div>

        <div
          className={`col-start-1 row-start-1 hidden min-w-0 lg:block ${PANEL_FADE} ${
            open
              ? "visible translate-x-0 opacity-100"
              : "invisible translate-x-4 opacity-0"
          }`}
        >
          <div className="ice-in" key={`${exam.id}-${openCount}`}>
            <DetailContent
              exam={exam}
              guest={guest}
              onReview={onReview}
              reviewing={reviewing}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ---------- Dòng đề trong danh sách ---------- */

function ExamRow({
  exam,
  guest,
  active,
  tabStop,
  reviewing,
  onPreview,
  onCancelPreview,
  onSelect,
  onReview,
}) {
  const title = getTitle(exam);
  const value = guest ? null : parseScore(exam.latestScore);
  const attempted = value != null;
  const tone = attempted ? getScoreTone(value) : null;
  const duration = getDuration(exam);
  const questions = getQuestionCount(exam);

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
            <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-raleway text-xs text-slate-500">
              {!guest && (
                <span
                  className={`font-semibold ${attempted ? tone.text : "text-slate-500"}`}
                >
                  {attempted ? tone.label : "Chưa thi"}
                </span>
              )}
              {duration && <span className="font-semibold font-gf">{duration} phút</span>}
              {questions && <span className="font-semibold font-gf">{questions} câu</span>}
            </span>
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
                  onReview={onReview}
                  reviewing={reviewing}
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

function ListSkeleton({ guest }) {
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
              <div className="h-3 w-1/3 rounded bg-slate-100 motion-safe:animate-pulse" />
            </div>
            <div className="h-11 w-11 rounded-full bg-slate-100 motion-safe:animate-pulse" />
          </div>
        ))}
      </div>
      <div
        className={`order-first h-72 rounded-3xl bg-slate-100 motion-safe:animate-pulse lg:order-none lg:h-[34rem] ${
          guest ? "hidden lg:block" : ""
        }`}
      />
    </div>
  );
}

/* ---------- Trang ---------- */

export function MockExamPage() {
  const navigate = useNavigate();
  const guest = useGuestMode();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [scores, setScores] = useState([]);
  const [scoresLoading, setScoresLoading] = useState(true);
  const [scoresError, setScoresError] = useState("");
  const [scoresRetry, setScoresRetry] = useState(0);
  const [reviewingId, setReviewingId] = useState("");
  const [reviewError, setReviewError] = useState("");
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

  async function handleReview(examId) {
    setReviewingId(examId);
    setReviewError("");
    try {
      const review = await getMockReview(examId);
      const reviewId = review.submissionId || examId;
      const reviewResult = { ...review, resultMode: "mock" };
      sessionStorage.setItem(`exam-result:${reviewId}`, JSON.stringify(reviewResult));
      navigate(`/ket-qua/${reviewId}`, { state: { result: reviewResult } });
    } catch (requestError) {
      setReviewError(
        getApiErrorMessage(
          requestError,
          "Không thể tải bài review. Vui lòng thử lại.",
        ),
      );
    } finally {
      setReviewingId("");
    }
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    const request = guest ? getGuestExams("MOCK") : fetchAllMockExams();

    request
      .then((items) => {
        if (active) setExams(items);
      })
      .catch((requestError) => {
        if (active)
          setError(
            getApiErrorMessage(
              requestError,
              "Không thể tải danh sách đề thi thử. Vui lòng thử lại.",
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

  useEffect(() => {
    if (guest) return undefined;
    let active = true;
    setScoresLoading(true);
    setScoresError("");

    getMockScores()
      .then((items) => {
        if (active) setScores(Array.isArray(items) ? items : []);
      })
      .catch((requestError) => {
        if (active)
          setScoresError(
            getApiErrorMessage(
              requestError,
              "Không thể tải lịch sử điểm thi thử.",
            ),
          );
      })
      .finally(() => {
        if (active) setScoresLoading(false);
      });

    return () => {
      active = false;
    };
  }, [guest, scoresRetry]);

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
        description={
          guest
            ? "Chọn một đề thi mẫu. Thời hạn được máy chủ xác thực; kết quả chỉ được giữ tạm trong phiên trình duyệt này."
            : "Chọn một đề thi thử để làm bài trong thời gian quy định. Bài tự nộp khi hết giờ nếu trang đang mở và có kết nối; hãy lưu thường xuyên trên thiết bị này."
        }
        eyebrow="Phòng thi"
        title="THI THỬ"
      />

      {reviewError && (
        <div
          className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4"
          role="alert"
        >
          <p className="text-sm font-medium text-red-700">{reviewError}</p>
          <button
            className={`shrink-0 rounded-lg px-3 py-1 text-sm font-semibold text-red-700 underline ${FOCUS_RING}`}
            onClick={() => setReviewError("")}
            type="button"
          >
            Đóng
          </button>
        </div>
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
              <p>
                Bạn đã thi{" "}
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
        {loading ? "Đang tải danh sách đề thi..." : ""}
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
          <p className="font-semibold font-inter text-lg text-slate-700">
            {keyword
              ? `Không tìm thấy đề thi nào khớp với “${keyword}”.`
              : "Chưa có đề thi thử nào được phát hành."}
          </p>
          {keyword && (
            <button
              className={`mt-3 rounded-lg font-inter text-lg px-3 py-1.5 text-sm font-semibold ${NAVY_TEXT} underline ${FOCUS_RING}`}
              onClick={() => setKeywordInput("")}
              type="button"
            >
              Xóa từ khóa
            </button>
          )}
        </div>
      )}

      {showSkeleton && <ListSkeleton guest={guest} />}

      {showList && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-gf text-lg font-bold text-[#102b5c]">
              Danh sách đề
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Chọn đề để xem thông tin và vào phòng thi.
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
            aria-label="Danh sách đề thi thử"
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
                onReview={handleReview}
                onSelect={selectExam}
                reviewing={reviewingId === exam.id}
                tabStop={exam.id === activeExam.id}
              />
            ))}
          </ul>

          <InspectorPanel
            exam={activeExam}
            guest={guest}
            onPointerEnter={enterRegion}
            onPointerLeave={leaveRegion}
            onRetryScores={() => setScoresRetry((current) => current + 1)}
            onReview={handleReview}
            open={panelOpen}
            openCount={openCount}
            reviewing={reviewingId === activeExam.id}
            scores={scores}
            scoresError={scoresError}
            scoresLoading={scoresLoading}
          />
        </div>
      )}
    </div>
  );
}
