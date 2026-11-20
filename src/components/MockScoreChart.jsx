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
import { formatDate, formatScore } from "../utils/mockScoreFormat";
import { getScoreTone } from "../utils/scoreTone";

const MAX_LABELLED_POINTS = 8;
const AXIS_TICK = { fill: "rgba(255,255,255,0.75)", fontSize: 12 };
const CHART_MARGIN = { top: 22, right: 18, left: 0, bottom: 0 };
const X_PADDING = { left: 14, right: 14 };
const Y_TICKS = [0, 5, 8, 10];
const Y_DOMAIN = [0, 10];
const CURSOR = { stroke: "rgba(255,255,255,0.35)", strokeDasharray: "4 4" };
const ACTIVE_DOT = { r: 8, strokeWidth: 0, fill: "#ffffff" };

// Chỉ hiện tối đa vài mốc ngày trên trục X để không bị chồng chữ.
function getTickIndexes(count, max = 6) {
  if (count <= max) return Array.from({ length: count }, (_, index) => index);
  const step = (count - 1) / (max - 1);
  return Array.from({ length: max }, (_, index) => Math.round(index * step));
}

function referenceLabel(value) {
  return {
    value,
    position: "insideBottomRight",
    fill: "rgba(255,255,255,0.7)",
    fontSize: 11,
  };
}

const VERY_GOOD_LABEL = referenceLabel("Rất tốt");
const PASS_LABEL = referenceLabel("Đạt");

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

export default function MockScoreChart({ data }) {
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
          <AreaChart data={data} margin={CHART_MARGIN}>
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
              padding={X_PADDING}
              tick={AXIS_TICK}
              tickFormatter={(index) => data[index]?.dateLabel ?? ""}
              tickLine={false}
              ticks={getTickIndexes(data.length)}
              type="number"
            />
            <YAxis
              axisLine={false}
              domain={Y_DOMAIN}
              tick={AXIS_TICK}
              tickLine={false}
              ticks={Y_TICKS}
              width={28}
            />
            <ReferenceLine
              label={VERY_GOOD_LABEL}
              stroke="rgba(255,255,255,0.35)"
              strokeDasharray="4 4"
              y={8}
            />
            <ReferenceLine
              label={PASS_LABEL}
              stroke="rgba(255,255,255,0.35)"
              strokeDasharray="4 4"
              y={5}
            />
            <Tooltip content={<ScoreTooltip />} cursor={CURSOR} />
            <Area
              activeDot={ACTIVE_DOT}
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
