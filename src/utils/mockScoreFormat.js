export function formatScore(value) {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

const DATE_FORMATTERS = {
  short: new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }),
  full: new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }),
};

export function formatDate(value, full = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FORMATTERS[full ? "full" : "short"].format(date);
}
