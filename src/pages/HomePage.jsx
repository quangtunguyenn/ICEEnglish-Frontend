import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Link } from 'react-router-dom'

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    number: '01',
    title: 'Luyện đề chuẩn cấu trúc Bộ GD',
    description: 'Kho đề bám sát ma trận, chấm điểm tức thì và phân tích từng kỹ năng.',
    screen: 'exam',
    label: 'LUYỆN ĐỀ',
  },
  {
    number: '02',
    title: 'Video bài giảng tương tác',
    description: 'Học ngữ pháp và mẹo làm bài qua những video ngắn, dễ hiểu, đúng trọng tâm.',
    screen: 'video',
    label: 'VIDEO',
  },
  {
    number: '03',
    title: 'Flashcard từ vựng thông minh',
    description: 'Ghi nhớ từ vựng theo ngữ cảnh với hệ thống ôn tập lặp lại ngắt quãng.',
    screen: 'flashcard',
    label: 'FLASHCARD',
  },
]

const students = [
  { name: 'Minh Anh', score: '9.8', school: 'THPT chuyên Ngoại ngữ', quote: 'Từ mất gốc đến 9.8 chỉ sau 6 tháng.' },
  { name: 'Đức Anh', score: '9.4', school: 'THPT Nguyễn Huệ', quote: 'Lộ trình rõ ràng, học đến đâu chắc đến đó.' },
  { name: 'Khánh Linh', score: '9.6', school: 'THPT Kim Liên', quote: 'Phần phân tích đề giúp mình tiến bộ rõ rệt.' },
]

function ProductScreen({ type }) {
  return (
    <div className={`product-screen product-screen--${type}`}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-[10px] font-bold tracking-[0.18em] text-cyan-300">ICE ENGLISH</span>
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
      </div>
      {type === 'exam' && (
        <div className="p-5">
          <div className="mb-5 h-2 w-32 rounded bg-white/80" />
          <div className="mb-3 text-xs text-slate-400">Câu 12 / 50</div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((item) => <div className={`screen-option ${item === 2 ? 'screen-option--active' : ''}`} key={item}><span>{String.fromCharCode(64 + item)}</span><i /></div>)}
          </div>
        </div>
      )}
      {type === 'video' && (
        <div className="p-5">
          <div className="video-placeholder"><span>▶</span></div>
          <div className="mt-4 h-2 w-40 rounded bg-white/80" />
          <div className="mt-2 h-2 w-24 rounded bg-white/20" />
        </div>
      )}
      {type === 'flashcard' && (
        <div className="p-5">
          <div className="flashcard-mini">
            <span className="text-xs uppercase tracking-widest text-cyan-300">Vocabulary</span>
            <strong>resilient</strong>
            <small>kiên cường, bền bỉ</small>
          </div>
          <div className="mt-4 flex justify-between text-xs text-slate-400"><span>12 từ hôm nay</span><span>82%</span></div>
        </div>
      )}
    </div>
  )
}

function HomePage() {
  const pageRef = useRef(null)
  const heroRef = useRef(null)
  const storyRef = useRef(null)
  const pathRef = useRef(null)
  const proofRef = useRef(null)
  const ctaRef = useRef(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true })
    let frame
    const raf = (time) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])

  useGSAP(() => {
    const heroTimeline = gsap.timeline()
    heroTimeline
      .from('.hero-copy > *', { y: 50, opacity: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' })
      .from('.hero-form', { y: 35, opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.35')

    const story = storyRef.current
    const screens = gsap.utils.toArray('.product-screen')
    const featureItems = gsap.utils.toArray('.feature-item')
    gsap.set(screens, { autoAlpha: 0, y: 28 })
    gsap.set(screens[0], { autoAlpha: 1, y: 0 })
    featureItems.forEach((item, index) => {
      ScrollTrigger.create({
        trigger: item,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => activateFeature(index),
        onEnterBack: () => activateFeature(index),
      })
    })
    function activateFeature(index) {
      featureItems.forEach((item, itemIndex) => item.classList.toggle('is-active', itemIndex === index))
      gsap.to(screens, { autoAlpha: 0, y: -20, duration: 0.35, overwrite: true })
      gsap.to(screens[index], { autoAlpha: 1, y: 0, duration: 0.55, overwrite: true })
    }
    ScrollTrigger.matchMedia({
      '(min-width: 768px)': () => {
        ScrollTrigger.create({ trigger: story, start: 'top top+=80', end: 'bottom bottom-=80', pin: '.device-sticky', pinSpacing: false })
      },
    })

    const line = pathRef.current?.querySelector('.path-line-progress')
    if (line) {
      gsap.fromTo(line, { strokeDashoffset: 1 }, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: { trigger: pathRef.current, start: 'top 70%', end: 'bottom 60%', scrub: 1 },
      })
      gsap.utils.toArray('.path-node').forEach((node) => {
        gsap.from(node, {
          scale: 0.45,
          opacity: 0.3,
          ease: 'back.out(2)',
          scrollTrigger: { trigger: node, start: 'top 70%', toggleActions: 'play none none reverse' },
        })
      })
    }

    const marquee = proofRef.current?.querySelector('.marquee-track')
    if (marquee) {
      gsap.to(marquee, { xPercent: -50, duration: 22, ease: 'none', repeat: -1 })
    }
    gsap.utils.toArray('.score-counter').forEach((counter) => {
      const value = Number(counter.dataset.value)
      gsap.fromTo(counter, { textContent: 0 }, {
        textContent: value,
        duration: 1.6,
        snap: { textContent: 0.1 },
        ease: 'power2.out',
        scrollTrigger: { trigger: counter, start: 'top 85%' },
      })
    })
    gsap.from(ctaRef.current, {
      y: 70,
      opacity: 0,
      scale: 0.96,
      duration: 0.9,
      ease: 'back.out(1.4)',
      scrollTrigger: { trigger: ctaRef.current, start: 'top 80%' },
    })
  }, { scope: pageRef })

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="landing-page" ref={pageRef}>
      <section className="hero-section mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28" ref={heroRef}>
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> Nền tảng ôn thi THPTQG #1</span>
          <h1>Chinh phục <span className="text-gradient">9+ Tiếng Anh</span><br />THPTQG.</h1>
          <p className="hero-subtitle">Lộ trình cá nhân hóa, luyện đề chuẩn cấu trúc và phương pháp học giúp bạn bứt phá điểm số mỗi ngày.</p>
          <div className="flex flex-wrap items-center gap-5">
            <a className="primary-button" href="#tinh-nang">Khám phá lộ trình <span>→</span></a>
            <div className="trust-badge"><span className="trust-avatars">A</span><span><b>★ 4.9/5</b><small>Từ 10.000+ học viên</small></span></div>
          </div>
        </div>
        <form className="hero-form" onSubmit={handleSubmit}>
          <div className="form-decoration" />
          <span className="form-label">BẮT ĐẦU MIỄN PHÍ</span>
          <h2>Nhận tư vấn lộ trình<br /><span>phù hợp với bạn.</span></h2>
          <p>Để lại thông tin, đội ngũ ICE sẽ liên hệ trong 24 giờ.</p>
          {submitted ? <div className="form-success">✓ Cảm ơn bạn! ICE sẽ liên hệ sớm nhất.</div> : <><input aria-label="Họ và tên" placeholder="Họ và tên của bạn" required /><input aria-label="Số điện thoại" placeholder="Số điện thoại" required type="tel" /><select aria-label="Mục tiêu điểm số" defaultValue=""><option disabled value="">Mục tiêu điểm số</option><option>7 - 8 điểm</option><option>8 - 9 điểm</option><option>9+ điểm</option></select><button className="form-button" type="submit">Đăng ký nhận tư vấn <span>↗</span></button></>}
          <small className="form-note">🔒 Thông tin của bạn được bảo mật tuyệt đối.</small>
        </form>
      </section>

      <section className="features-section" id="tinh-nang" ref={storyRef}>
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-[0.8fr_1.2fr]">
          <div className="device-sticky"><div className="device-frame"><div className="device-camera" />{features.map((feature) => <ProductScreen key={feature.screen} type={feature.screen} />)}</div><p className="device-caption">HỌC MỌI LÚC, MỌI NƠI</p></div>
          <div className="features-copy"><span className="eyebrow">Mọi thứ bạn cần để bứt phá</span><h2>Một hệ thống.<br /><span>Ba bước tiến bộ.</span></h2>{features.map((feature) => <article className={`feature-item ${feature.number === '01' ? 'is-active' : ''}`} key={feature.number}><span className="feature-number">{feature.number}</span><div><span className="feature-tag">{feature.label}</span><h3>{feature.title}</h3><p>{feature.description}</p></div></article>)}</div>
        </div>
      </section>

      <section className="path-section mx-auto max-w-7xl px-6 py-28" ref={pathRef}>
        <div className="section-heading"><span className="eyebrow">Lộ trình được thiết kế cho bạn</span><h2>Từ nền tảng đến <span>9+.</span></h2><p>Đi đúng hướng, tiến bộ vững vàng qua từng giai đoạn.</p></div>
        <div className="path-track"><svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 100 4"><path className="path-line" d="M 0 2 L 100 2" pathLength="1" /><path className="path-line-progress" d="M 0 2 L 100 2" pathLength="1" /></svg><div className="path-nodes">{[['01', 'Lấy lại gốc', 'Củng cố nền tảng ngữ pháp & từ vựng.'], ['02', 'Nắm chắc chuyên đề', 'Làm chủ từng dạng bài thường gặp.'], ['03', 'Luyện đề thực chiến', 'Tăng tốc và chinh phục mục tiêu 9+.']].map(([number, title, text]) => <div className="path-node" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></div>)}</div></div>
      </section>

      <section className="proof-section overflow-hidden py-24" ref={proofRef}><div className="mx-auto max-w-7xl px-6"><div className="section-heading flex flex-wrap items-end justify-between gap-6"><div><span className="eyebrow">Kết quả nói lên tất cả</span><h2>Hàng ngàn bạn trẻ đã <span>bứt phá.</span></h2></div><Link className="text-link" to="/luyen-de">Xem thêm câu chuyện →</Link></div></div><div className="marquee-window mt-12"><div className="marquee-track" onMouseEnter={() => gsap.getTweensOf('.marquee-track').forEach((tween) => tween.pause())} onMouseLeave={() => gsap.getTweensOf('.marquee-track').forEach((tween) => tween.resume())}>{[...students, ...students].map((student, index) => <article className="student-card" key={`${student.name}-${index}`}><div className="flex items-start justify-between"><span className="student-avatar">{student.name[0]}</span><span className="student-score"><b className="score-counter" data-value={student.score}>0</b><small>/ 10</small></span></div><p>“{student.quote}”</p><footer><b>{student.name}</b><span>{student.school}</span></footer></article>)}</div></div></section>

      <section className="cta-section mx-6 my-24 rounded-[2rem] px-6 py-20 text-center sm:px-12" ref={ctaRef}><span className="eyebrow justify-center text-cyan-300">Sẵn sàng cho mục tiêu mới?</span><h2>Bắt đầu lộ trình của bạn<br /><span>ngay hôm nay.</span></h2><p>Ưu đãi 30% cho 50 bạn đăng ký đầu tiên trong tháng này.</p><a className="primary-button primary-button--light" href="#top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Nhận ưu đãi ngay <span>→</span></a></section>
    </div>
  )
}

export { HomePage }
