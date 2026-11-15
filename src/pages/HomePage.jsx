import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import { ConsultationForm } from "../components/ConsultationForm";
import "./HomePage.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const features = [
  {
    number: "01",
    category: "PHÒNG THI ẢO",
    title: "Vững thao tác, tự tin vào phòng thi",
    description:
      "Làm quen giao diện thi, luyện chọn đáp án và điều hướng câu hỏi để chuẩn bị tâm lý trước kỳ thi.",
    image: "/Screenshot%202026-11-15%20195928.png",
    imageAlt: "Ảnh chụp màn hình phòng thi ảo khi đang làm bài",
    destination: "/thi-thu",
    action: "Trải nghiệm phòng thi",
  },
  {
    number: "02",
    category: "BÀI GIẢNG VIDEO",
    title: "Học đúng trọng tâm qua video tương tác",
    description:
      "Củng cố ngữ pháp bằng bài giảng dễ theo dõi, kết hợp nội dung từ vựng đa chủ đề gắn với bài học.",
    image: "/Screenshot%202026-11-15%20200011.png",
    imageAlt: "Ảnh chụp trang bài giảng video và danh sách chuyên đề",
    destination: "/video",
    action: "Khám phá bài giảng",
  },
  {
    number: "03",
    category: "TỪ VỰNG & FLASHCARD",
    title: "Ghi nhớ từ vựng chủ động, sinh động",
    description:
      "Luyện từ theo chủ đề với flashcard trực quan, kết hợp phát âm, nghĩa và ví dụ trong ngữ cảnh.",
    image: "/Screenshot%202026-11-15%20200019.png",
    imageAlt: "Ảnh chụp tính năng học từ vựng bằng flashcard",
    destination: "/tu-vung",
    action: "Luyện tập từ vựng",
  },
  {
    number: "04",
    category: "THƯ VIỆN BÀI ĐỌC",
    title: "Đọc hiểu tốt hơn qua chủ đề đa dạng",
    description:
      "Rèn kỹ năng đọc và trau dồi từ vựng trong ngữ cảnh qua các bài đọc cùng câu hỏi luyện tập.",
    image: "/Screenshot%202026-11-15%20200043.png",
    imageAlt: "Ảnh chụp thư viện bài đọc và nội dung đọc hiểu",
    destination: "/doc-hieu",
    action: "Mở thư viện bài đọc",
  },
];

const courseStages = [
  {
    number: "01",
    phase: "XÂY NỀN",
    title: "Củng cố ngữ pháp",
    description:
      "Học kiến thức trọng tâm qua video bài giảng, nắm chắc quy tắc và cách vận dụng.",
  },
  {
    number: "02",
    phase: "LUYỆN TẬP",
    title: "Rèn luyện không giới hạn",
    description:
      "Luyện tập không giới hạn với các tính năng trên website: phòng thi ảo, video, từ vựng, flashcard và thư viện bài đọc.",
  },
  {
    number: "03",
    phase: "TĂNG CƯỜNG",
    title: "Giải đề xuyên suốt",
    description:
      "Duy trì giải đề đến ngày thi, nhìn lại kết quả và tập trung cải thiện phần còn yếu.",
  },
  {
    number: "04",
    phase: "NƯỚC RÚT",
    title: "Tăng tốc đúng thời điểm",
    description:
      "Tăng số lượng đề, luyện bấm giờ và hoàn thiện chiến lược trước ngày thi.",
  },
];

function ProductScreenshot({ feature }) {
  return (
    <figure className="feature-shot">
      <img
        alt={feature.imageAlt}
        className="feature-shot-image"
        decoding="async"
        loading="lazy"
        src={feature.image}
      />
    </figure>
  );
}

function HomePage() {
  const pageRef = useRef(null);

  useGSAP(
    () => {
      gsap.timeline()
        .from(".hero-copy > *", {
          y: 30,
          opacity: 0,
          duration: 0.65,
          stagger: 0.12,
          ease: "power3.out",
        })
        .from(".hero-visual", {
          y: 24,
          opacity: 0,
          duration: 0.75,
          ease: "power3.out",
        }, "-=0.4");

      gsap.from(".section-intro > *", {
        y: 25,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: { trigger: ".section-intro", start: "top 85%", once: true },
      });

      gsap.utils.toArray(".feature-card").forEach((card, index) => {
        gsap.from(card.children, {
          y: 30,
          opacity: 0,
          duration: 0.7,
          delay: (index % 2) * 0.08,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: card, start: "top 86%", once: true },
        });
      });

      gsap.from(".aca-image-wrap", {
        x: -36,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: ".aca-section", start: "top 82%", once: true },
      });

      gsap.from(".aca-copy > *", {
        y: 28,
        opacity: 0,
        duration: 0.65,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: { trigger: ".aca-copy", start: "top 82%", once: true },
      });

      const progressLine = pageRef.current?.querySelector(".course-progress-line");
      if (progressLine) {
        const media = gsap.matchMedia();
        media.add(
          { compact: "(max-width: 767px)", wide: "(min-width: 768px)" },
          (context) => {
            const isCompact = context.conditions.compact;
            const scaleAxis = isCompact ? "scaleY" : "scaleX";
            gsap.fromTo(
              progressLine,
              { [scaleAxis]: 0 },
              {
                [scaleAxis]: 1,
                transformOrigin: isCompact ? "top center" : "left center",
                ease: "none",
                scrollTrigger: {
                  trigger: ".course-track",
                  start: "top 75%",
                  end: "bottom 65%",
                  scrub: 0.7,
                },
              },
            );
          },
        );
      }

      gsap.from(".course-heading > *", {
        y: 28,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".course-heading",
          start: "top 85%",
          once: true,
        },
      });

      gsap.utils.toArray(".course-stage").forEach((stage, index) => {
        gsap.from(stage, {
          y: 24,
          opacity: 0,
          duration: 0.65,
          delay: index * 0.08,
          ease: "power2.out",
          scrollTrigger: { trigger: stage, start: "top 88%", once: true },
        });
      });

      gsap.from(".final-cta-content > *", {
        y: 22,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: ".final-cta", start: "top 82%", once: true },
      });
    },
    { scope: pageRef },
  );

  return (
    <div className="landing-page" ref={pageRef}>
      <section className="hero-section" id="top">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            LỘ TRÌNH ÔN THI TIẾNG ANH THPTQG
          </span>
          <h1>
            Học đúng trọng tâm.
            <br />
            <span className="text-gradient">Bứt phá điểm số.</span>
          </h1>
          <p className="hero-subtitle">
            Từ bài giảng, từ vựng và đọc hiểu đến phòng thi ảo và bộ đề ACA
            độc quyền — mọi bước ôn thi được kết nối trong một lộ trình rõ ràng.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#lo-trinh">
              Khám phá lộ trình <span>→</span>
            </a>
            <Link className="secondary-button" to="/thi-thu">
              Trải nghiệm phòng thi ảo
            </Link>
          </div>
          <div className="hero-highlights">
            <span><i>01</i> Bài giảng trọng tâm</span>
            <span><i>02</i> Luyện đề mỗi tuần</span>
            <span><i>03</i> Thi thử mô phỏng</span>
          </div>
        </div>

        <div className="hero-visual">
          <div aria-hidden="true" className="hero-orbit hero-orbit--outer" />
          <div aria-hidden="true" className="hero-orbit hero-orbit--inner" />
          <div className="hero-course-card">
            <div className="hero-card-brand">
              <img alt="" src="/ice_english_emblem_vector.svg" />
              <span>ICE ENGLISH</span>
            </div>
            <span className="hero-card-kicker">ICE MASTERCLASS</span>
            <h2>Bứt phá điểm số<br />THPTQG</h2>
            <div className="hero-card-divider" />
            <div className="hero-card-steps">
              {courseStages.map((stage) => (
                <span key={stage.number}>
                  <i>{stage.number}</i>
                  {stage.title}
                </span>
              ))}
            </div>
            <div className="hero-card-foot">
              <span>Hành trình học tập</span>
              <b>Đến ngày thi</b>
            </div>
          </div>
          <div className="hero-float-card hero-float-card--top">
            <span aria-hidden="true" className="hero-float-icon">↗</span>
            <span><b>Học và luyện tập</b><small>trên cùng một nền tảng</small></span>
          </div>
          <div className="hero-float-card hero-float-card--bottom">
            <span aria-hidden="true" className="hero-float-pulse" />
            Tăng tốc ở giai đoạn nước rút
          </div>
        </div>
      </section>

      <section aria-labelledby="features-title" className="features-section" id="tinh-nang">
        <div className="section-shell">
          <div className="section-intro home-block">
            <span className="eyebrow">HỆ SINH THÁI HỌC TẬP ICE</span>
            <h2 id="features-title">
              Một nền tảng.
              <br />
              <span>Bốn cách tiến bộ.</span>
            </h2>
            <p>
              Từ làm quen phòng thi đến đọc hiểu chuyên sâu, mỗi tính năng
              giúp bạn chủ động rèn một phần quan trọng cho kỳ thi.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature) => (
              <article className="feature-card home-block" key={feature.number}>
                <ProductScreenshot feature={feature} />
                <div className="feature-card-copy">
                  <span className="feature-index">
                    <i>{feature.number}</i>
                    {feature.category}
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <Link className="feature-link" to={feature.destination}>
                    {feature.action}
                    <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="aca-title" className="aca-section" id="bo-de-aca">
        <div className="section-shell">
          <div className="aca-layout">
            <figure className="aca-image-wrap">
              <img
                alt="Ba trang đề thi ACA được trình bày cạnh nhau"
                className="aca-image"
                decoding="async"
                loading="lazy"
                src="/Screenshot%202026-11-15%20205140.png"
              />
              <figcaption>BỘ ĐỀ ACA · LUYỆN TẬP THEO TUẦN</figcaption>
            </figure>

            <div className="aca-copy">
              <span className="eyebrow">LUYỆN ĐỀ CHUYÊN SÂU</span>
              <h2 id="aca-title">
                Bộ đề ACA
                <br />
                <span>độc quyền</span>
              </h2>
              <p>
                Được biên soạn chuyên sâu, bám sát cấu trúc đề thi của Bộ Giáo
                dục và Đào tạo, giúp học sinh luyện tập đúng trọng tâm.
              </p>
              <div className="aca-weekly-plan">
                <div>
                  <strong>02</strong>
                  <span>đề luyện tập mỗi tuần</span>
                </div>
                <div>
                  <strong>01</strong>
                  <span>đề đánh giá năng lực thường xuyên</span>
                </div>
              </div>
              <p className="aca-livestream">
                <span aria-hidden="true">●</span>
                Giải đề livestream chuyên sâu cùng học sinh.
              </p>
              <Link className="aca-link" to="/luyen-de">
                Khám phá đề luyện tập <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="course-title" className="course-section" id="lo-trinh">
        <div className="section-shell">
          <div className="course-heading">
            <div>
              <span className="eyebrow">LỘ TRÌNH HỌC TẬP</span>
              <h2 id="course-title">
                ICE Masterclass:
                <br />
                <span>Bứt phá điểm số THPTQG</span>
              </h2>
              <p>
                Học chắc nền tảng, luyện đều kỹ năng và tăng tốc với kế hoạch
                rõ ràng xuyên suốt đến ngày thi.
              </p>
            </div>
            <div className="course-note">
              <span className="course-note-mark">
                <img alt="" src="/ice_english_emblem_vector.svg" />
              </span>
              <span className="course-note-label">ĐƯỜNG DÀI VỮNG VÀNG</span>
              <strong>Học · Luyện · Bứt phá</strong>
              <small>Linh hoạt sử dụng các tính năng trên ICE English trong từng giai đoạn.</small>
            </div>
          </div>

          <div className="course-track">
            <div aria-hidden="true" className="course-progress-line" />
            {courseStages.map((stage) => (
              <article className="course-stage" key={stage.number}>
                <span className="course-stage-number">{stage.number}</span>
                <span className="course-stage-phase">{stage.phase}</span>
                <h3>{stage.title}</h3>
                <p>{stage.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-cta-content">
          <span className="eyebrow">BƯỚC TIẾP THEO BẮT ĐẦU TỪ BẠN</span>
          <h2>Sẵn sàng bắt đầu<br /><span>hành trình của mình?</span></h2>
          <p>Chọn một tính năng để bắt đầu học và rèn luyện ngay hôm nay.</p>
          <div className="hero-actions">
            <Link className="primary-button primary-button--light" to="/thi-thu">
              Vào phòng thi ảo <span>→</span>
            </Link>
            <a className="cta-text-link" href="#tu-van">Tìm hiểu tư vấn khóa học</a>
          </div>
        </div>
        <img alt="" aria-hidden="true" className="cta-watermark" src="/ice_english_emblem_vector.svg" />
      </section>

      <section aria-labelledby="consultation-title" className="consultation-section" id="tu-van">
        <div className="section-shell consultation-layout">
          <div className="consultation-intro">
            <span className="eyebrow">ĐỒNG HÀNH CÙNG ICE ENGLISH</span>
            <h2 id="consultation-title">Bắt đầu từ mục tiêu của bạn.</h2>
            <p>
              Tìm hiểu lộ trình học và luyện tập cùng ICE Masterclass, phù hợp
              với mục tiêu điểm số của bạn.
            </p>
            <div className="consultation-detail">
              <span>01</span>
              <p>Chia sẻ mục tiêu điểm số và thông tin liên hệ.</p>
            </div>
            <div className="consultation-detail">
              <span>02</span>
              <p>Tìm hiểu lộ trình học và luyện tập cùng ICE English.</p>
            </div>
          </div>

          <ConsultationForm />
        </div>
      </section>
    </div>
  );
}

export { HomePage };
