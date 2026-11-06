export function formatPracticeSubmissionDate(value) {
  const date = new Date(value)
  if (
    typeof value !== 'string' ||
    !/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ||
    Number.isNaN(date.getTime())
  ) {
    throw new Error('Thời gian nộp bài không hợp lệ.')
  }
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hourCycle: 'h23',
  }).format(date)
}
