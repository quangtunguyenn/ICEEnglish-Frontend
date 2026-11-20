import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CONSULTATION_PATH = '/#tu-van'

const InviteContext = createContext(() => {})

export function useConsultationInvite() {
  return useContext(InviteContext)
}

function scrollToConsultation() {
  let attempts = 0
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const tick = () => {
    const target = document.getElementById('tu-van')
    if (target) {
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    } else if (attempts++ < 30) {
      setTimeout(tick, 100)
    }
  }
  tick()
}

export function ConsultationInviteProvider({ children }) {
  const navigate = useNavigate()
  const [invite, setInvite] = useState(null)

  const proceed = useCallback(() => {
    setInvite(null)
    navigate(CONSULTATION_PATH)
    scrollToConsultation()
  }, [navigate])

  const close = useCallback(() => setInvite(null), [])

  const open = useCallback((subject) => {
    setInvite({ subject: subject || '', id: Date.now() })
  }, [])

  useEffect(() => {
    if (!invite) return undefined
    const onKey = (event) => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [invite, close])

  return (
    <InviteContext.Provider value={open}>
      {children}
      {invite && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#081a33]/55 p-4 backdrop-blur-[2px] motion-safe:animate-[invite-fade_.25s_ease-out]"
          key={invite.id}
          onClick={(event) => { if (event.target === event.currentTarget) close() }}
        >
          <style>{`
            @keyframes invite-fade { from { opacity: 0 } to { opacity: 1 } }
            @keyframes invite-rise { from { opacity: 0; transform: translateY(14px) scale(.97) } to { opacity: 1; transform: none } }
          `}</style>
          <div
            aria-labelledby="invite-title"
            aria-live="polite"
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white text-center shadow-[0_30px_70px_-20px_rgba(8,26,51,0.65)] motion-safe:animate-[invite-rise_.35s_cubic-bezier(.2,.8,.2,1)]"
            role="alertdialog"
          >
            <div className="bg-gradient-to-br from-[#163867] to-[#081a33] px-6 pb-6 pt-9">
              <img
                alt="ICE English"
                className="mx-auto h-24 w-auto brightness-0 invert sm:h-28"
                src="/ice_english_emblem_vector.svg"
              />
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-ice-gold">
                Dành riêng cho học viên
              </p>
            </div>
            <div className="px-6 pb-6 pt-5">
              <h2 className="font-gf text-xl font-bold leading-snug text-slate-900" id="invite-title">
                Trở thành học viên ICE English
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {invite.subject
                  ? `“${invite.subject}” là nội dung dành cho học viên của ICE English. `
                  : 'Nội dung này dành cho học viên của ICE English. '}
                Hãy đăng ký tư vấn để được đồng hành cùng đội ngũ giáo viên và trải nghiệm trọn vẹn mọi tính năng.
              </p>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                <button
                  className="rounded-full px-5 py-2.5 font-gf text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                  onClick={close}
                  type="button"
                >
                  Để sau
                </button>
                <button
                  autoFocus
                  className="rounded-full bg-ice-gold px-6 py-2.5 font-gf text-sm font-bold text-slate-900 transition-colors hover:bg-ice-gold-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ice-gold"
                  onClick={proceed}
                  type="button"
                >
                  Đăng ký tư vấn ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </InviteContext.Provider>
  )
}
