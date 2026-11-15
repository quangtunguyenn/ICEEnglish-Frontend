// Đổi kích thước logo tại đây; logo lớn hơn chiều cao thanh sẽ bị cắt ở mép thanh.
const LOGO_SIZE = { width: '180px', height: '250px' }

function formatExamDate(value) {
  const timestamp = Date.parse(value || '')
  if (!Number.isFinite(timestamp)) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(timestamp)
}

export function ExamIdentityBar({
  candidateName = 'Thí sinh',
  candidateSbd = '—',
  examStartedAt,
  showIdentity = true,
  children,
}) {
  return (
    <header className={`relative grid min-h-[72px] shrink-0 grid-cols-1 items-center gap-x-4 gap-y-2 overflow-hidden bg-[#102b5c] px-4 py-2 text-white sm:px-6 ${showIdentity ? 'sm:grid-cols-[minmax(0,1fr)_auto]' : ''}`}>
      <div className={`pointer-events-none flex min-w-0 items-center ${showIdentity ? 'relative z-0' : 'absolute left-4 top-1/2 z-0 -translate-y-1/2 sm:left-48'}`}>
        {showIdentity && (
          <div className="relative z-10 min-w-0">
            <p className="truncate text-sm font-bold">{candidateName}</p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-white/90 sm:text-xs">
              <span>SBD: {candidateSbd}</span>
              <span>Môn thi: TIẾNG ANH</span>
              <span>Ngày thi: {formatExamDate(examStartedAt)}</span>
            </div>
          </div>
        )}
        {/* ml-2 là khoảng cách tới thông tin; bài tập về nhà chỉnh left-4/sm:left-6 và top-1/2 ở div trên. */}
        <span aria-hidden="true" className={`relative block h-0 shrink-0 ${showIdentity ? 'ml-1' : ''}`} style={{ width: LOGO_SIZE.width }}>
          <img
            alt=""
            className="absolute left-0 top-1/2 -translate-y-1/2 object-contain opacity-20 brightness-0 invert"
            src="/ice_english_emblem_vector.svg"
            style={LOGO_SIZE}
          />
        </span>
      </div>
      {children && <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 sm:justify-end">{children}</div>}
    </header>
  )
}
