import { useConsultationInvite } from './ConsultationInvite'

export const isExamLockedForGuest = (guest, exam) => Boolean(guest) && exam?.accessible === false

export function LockedExamButton({ title, label, className = '' }) {
  const promptConsultation = useConsultationInvite()
  return (
    <button
      aria-label={`${label} (dành cho học viên): ${title}`}
      className={`group relative inline-flex w-full min-w-[230px] items-center justify-center gap-3 rounded-full border-2 border-ice-gold/70 bg-white/10 px-8 py-3.5 font-roboto text-lg font-bold tracking-wide text-current transition-all duration-300 hover:-translate-y-0.5 hover:bg-ice-gold hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ice-gold active:scale-[0.98] motion-reduce:transition-none ${className}`}
      onClick={() => promptConsultation(title)}
      type="button"
    >
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M16 11V7a4 4 0 10-8 0v4m-1 0h10a1 1 0 011 1v7a1 1 0 01-1 1H7a1 1 0 01-1-1v-7a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  )
}

export const guestRowClass = (guest, exam) => {
  if (!guest || exam?.accessible === undefined) return ''
  return exam.accessible
    ? 'border-ice-gold bg-ice-gold-50/60 shadow-[0_10px_28px_-16px_rgba(212,160,23,0.6)] ring-1 ring-ice-gold/40'
    : 'opacity-80'
}

export function GuestExamBadge({ guest, exam }) {
  if (!guest || exam?.accessible === undefined) return null
  return exam.accessible ? (
    <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-ice-gold px-2.5 py-0.5 font-gf text-[11px] font-bold uppercase tracking-wide text-slate-900">
      <svg aria-hidden="true" className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 1l2.6 5.6 6.1.7-4.5 4.2 1.2 6L10 14.5 4.6 17.5l1.2-6L1.3 7.3l6.1-.7z" />
      </svg>
      Trải nghiệm miễn phí
    </span>
  ) : (
    <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-gf text-[11px] font-semibold text-slate-500">
      <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
        <path d="M16 11V7a4 4 0 10-8 0v4m-1 0h10a1 1 0 011 1v7a1 1 0 01-1 1H7a1 1 0 01-1-1v-7a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Dành cho học viên
    </span>
  )
}
