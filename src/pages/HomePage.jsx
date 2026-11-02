import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const sections = [
  {
    eyebrow: '01 / Học đúng hướng',
    title: 'Một lộ trình rõ ràng cho từng mục tiêu.',
    description:
      'Từ nền tảng đến nâng cao, mỗi bài học được sắp xếp để bạn luôn biết bước tiếp theo là gì.',
    action: 'Khám phá lộ trình',
    to: '/luyen-de',
    accent: 'bg-cyan-400',
  },
  {
    eyebrow: '02 / Luyện tập thông minh',
    title: 'Biến thời gian học thành tiến bộ thực tế.',
    description:
      'Luyện đề theo chủ đề, xem lại câu trả lời và tập trung vào những kỹ năng bạn còn yếu.',
    action: 'Bắt đầu luyện đề',
    to: '/luyen-de',
    accent: 'bg-violet-400',
  },
  {
    eyebrow: '03 / Sẵn sàng bứt phá',
    title: 'Thi thử như thật, tự tin hơn mỗi ngày.',
    description:
      'Mô phỏng phòng thi với thời gian và cấu trúc đề chuẩn để bạn làm quen áp lực trước ngày thi.',
    action: 'Vào phòng thi',
    to: '/thi-thu',
    accent: 'bg-amber-300',
  },
]

function useScrollReveal() {
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element || !('IntersectionObserver' in window)) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('is-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return ref
}

function StorySection({ section, index }) {
  const revealRef = useScrollReveal()

  return (
    <section
      className="home-story-section scroll-mt-24 snap-start"
      ref={revealRef}
    >
      <div className="grid min-h-[72vh] items-center gap-10 py-20 lg:grid-cols-2">
        <div className={index % 2 ? 'lg:order-2' : ''}>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-cyan-600">
            {section.eyebrow}
          </p>
          <h2 className="max-w-xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            {section.title}
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
            {section.description}
          </p>
          <Link
            className="mt-8 inline-flex rounded-lg bg-slate-900 px-5 py-3 font-bold text-white transition hover:-translate-y-1 hover:bg-slate-700"
            to={section.to}
          >
            {section.action} →
          </Link>
        </div>
        <div className={`story-card ${section.accent} ${index % 2 ? 'lg:order-1' : ''}`}>
          <span className="text-8xl font-black text-slate-900/15">0{index + 1}</span>
          <div className="mt-auto">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-900/60">
              ICE English
            </p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              Học tập có mục tiêu.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function HomePage() {
  return (
    <div className="home-scroll-container">
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl snap-start items-center px-6 py-20">
        <div className="max-w-4xl">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.3em] text-cyan-600">
            Nền tảng học tiếng Anh
          </p>
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-7xl">
            Chinh phục tiếng Anh
            <span className="block text-cyan-500">theo cách của bạn.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-xl leading-9 text-slate-600">
            Lộ trình cá nhân hóa, bài luyện tập thực tế và những video ngắn giúp
            bạn tiến bộ mỗi ngày.
          </p>
          <Link
            className="mt-9 inline-flex rounded-lg bg-slate-900 px-6 py-3.5 font-bold text-white transition hover:-translate-y-1 hover:bg-slate-700"
            to="/luyen-de"
          >
            Bắt đầu học
          </Link>
          <p className="mt-12 text-sm font-semibold text-slate-400">
            ↓ Kéo xuống để khám phá
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6">
        {sections.map((section, index) => (
          <StorySection index={index} key={section.eyebrow} section={section} />
        ))}
      </div>
    </div>
  )
}
