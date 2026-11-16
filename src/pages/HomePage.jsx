import { useEffect, useRef, useState } from "react";
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
    image: "/phong-thi-ao.png",
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
    image: "/bai-giang.png",
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
    image: "/flashcard.png",
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
    image: "/thu-vien.png",
    imageAlt: "Ảnh chụp thư viện bài đọc và nội dung đọc hiểu",
    destination: "/doc-hieu",
    action: "Mở thư viện bài đọc",
  },
];

const examScreenshots = [
  {
    image: "/giao dien vao thi.png",
    alt: "Giao diện đăng nhập làm bài thi thử",
    caption: "Đăng nhập vào kỳ thi",
  },
  {
    image: "/giao dien vao thi 2.png",
    alt: "Giao diện thông tin thí sinh và lựa chọn môn thi",
    caption: "Kiểm tra thông tin và vào thi",
  },
  {
    image: "/phong-thi-ao.png",
    alt: "Giao diện phòng thi với bài đọc, câu hỏi và đồng hồ đếm ngược",
    caption: "Làm bài trong phòng thi ảo",
  },
];

const resultScreenshots = [
  {
    image: "/chi-tiet-ket-qua.png",
    alt: "Kết quả thi thử và thời gian làm bài theo từng phần",
    caption: "Kết quả và thời gian từng phần",
  },
  {
    image: "/dap-an.png",
    alt: "Đáp án, giải thích và gợi ý video ôn tập",
    caption: "Đáp án và video ôn tập",
  },
  {
    image: "/doan-dich.png",
    alt: "Bài đọc tiếng Anh và bản dịch tiếng Việt đặt cạnh nhau",
    caption: "Đối chiếu bản dịch bài đọc",
  },
  {
    image: "/chi-tiet-thi-thu.png",
    alt: "Thông tin đề thi thử và điểm số gần nhất",
    caption: "Theo dõi chi tiết từng đề thi",
  },
  {
    image: "/bieu-do-diem.png",
    alt: "Biểu đồ xu hướng điểm số qua các lần thi thử",
    caption: "Biểu đồ tiến bộ qua các bài thi",
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

function ZoomableImage({ src, alt, imageClassName, onOpen }) {
  return (
    <button
      aria-label={`Phóng to: ${alt}`}
      className="image-zoom-trigger"
      onClick={() => onOpen({ src, alt })}
      type="button"
    >
      <img alt={alt} className={imageClassName} decoding="async" loading="lazy" src={src} />
      <span className="exam-gallery-zoom" aria-hidden="true">↗</span>
    </button>
  );
}

function ProductScreenshot({ feature, onOpen }) {
  return (
    <figure className="feature-shot">
      <ZoomableImage
        alt={feature.imageAlt}
        imageClassName="feature-shot-image"
        onOpen={onOpen}
        src={feature.image}
      />
    </figure>
  );
}

function ScreenshotGallery({ screenshots, onOpen }) {
  return (
    <div className="exam-gallery">
      {screenshots.map((screenshot, index) => (
        <figure className="exam-gallery-item" key={screenshot.image}>
          <ZoomableImage alt={screenshot.alt} onOpen={onOpen} src={screenshot.image} />
          <figcaption><span>{String(index + 1).padStart(2, "0")}</span>{screenshot.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function HomePage() {
  const pageRef = useRef(null);
  const imageDialogRef = useRef(null);
  const imageCloseRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageZoom, setImageZoom] = useState(1);

  useEffect(() => {
    if (!selectedImage) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedImage]);

  function openImage(image) {
    setSelectedImage(image);
    setImageZoom(1);
    imageDialogRef.current.showModal();
    imageCloseRef.current.focus();
  }

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

      gsap.to(".hero-course-card", {
        y: -10,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".hero-float-card", {
        y: -14,
        duration: 2.5,
        stagger: 0.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

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

      gsap.utils.toArray(".exam-showcase").forEach((section) => {
        gsap.from(section.querySelector(".exam-showcase-heading"), {
          y: 30,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: section, start: "top 82%", once: true },
        });
        section.querySelectorAll(".exam-gallery-item").forEach((item) => {
          gsap.from(item, {
            y: 35,
            opacity: 0,
            duration: 0.65,
            ease: "power2.out",
            scrollTrigger: { trigger: item, start: "top 88%", once: true },
          });
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
                <ProductScreenshot feature={feature} onOpen={openImage} />
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

      <section aria-labelledby="exam-experience-title" className="exam-showcase" id="phong-thi-ao">
        <div className="section-shell">
          <div className="exam-showcase-heading">
            <span className="eyebrow">TRẢI NGHIỆM PHÒNG THI ẢO</span>
            <h2 id="exam-experience-title">Quen giao diện thi.<br /><span>Vững vàng tâm lý.</span></h2>
            <p>
              Giao diện phòng thi được xây dựng theo sát đề án và công bố của Bộ
              Giáo dục và Đào tạo, giúp học sinh làm quen từ bước đăng nhập,
              vào thi đến chọn đáp án và quản lý thời gian. Luyện tập trước để
              tự tin hơn khi bước vào kỳ thi.
            </p>
            <div className="showcase-tags"><span>01 · Đăng nhập</span><span>02 · Vào thi</span><span>03 · Làm bài</span></div>
          </div>
          <ScreenshotGallery screenshots={examScreenshots} onOpen={openImage} />
          <Link className="feature-link exam-showcase-link" to="/thi-thu">
            Trải nghiệm phòng thi ảo <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="exam-results-title" className="exam-showcase exam-showcase--results" id="theo-doi-ket-qua">
        <div className="section-shell">
          <div className="exam-showcase-heading">
            <span className="eyebrow">KẾT QUẢ &amp; TIẾN BỘ</span>
            <h2 id="exam-results-title">Hiểu kết quả.<br /><span>Nhìn rõ tiến bộ.</span></h2>
            <p>
              Theo dõi điểm số và thời gian làm từng phần, xem đáp án cùng bản
              dịch bài đọc trực quan. Các gợi ý video bài giảng giúp ôn lại kiến
              thức liên quan, trong khi biểu đồ năng lực qua các bài thi giúp
              bạn nhận ra sự tiến bộ và điều chỉnh cách học.
            </p>
            <div className="showcase-tags"><span>Thời gian từng phần</span><span>Đáp án &amp; bài giảng</span><span>Biểu đồ tiến bộ</span></div>
          </div>
          <ScreenshotGallery screenshots={resultScreenshots} onOpen={openImage} />
        </div>
      </section>

      <section aria-labelledby="aca-title" className="aca-section" id="bo-de-aca">
        <div className="section-shell">
          <div className="aca-layout">
            <figure className="aca-image-wrap">
              <ZoomableImage
                alt="Ba trang đề thi ACA được trình bày cạnh nhau"
                imageClassName="aca-image"
                onOpen={openImage}
                src="/bo-de.png"
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
          <Link className="feature-link course-details-link" to="/khoa-hoc/ice-masterclass">
            Tìm hiểu khóa học ICE Masterclass <span aria-hidden="true">↗</span>
          </Link>
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

      <dialog
        aria-label={selectedImage ? `Ảnh phóng to: ${selectedImage.alt}` : "Ảnh phóng to"}
        className="image-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) imageDialogRef.current.close();
        }}
        onClose={() => setSelectedImage(null)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            imageDialogRef.current.close();
          }
        }}
        ref={imageDialogRef}
      >
        <div className="image-dialog-toolbar">
          <span>{selectedImage?.alt}</span>
          <div className="image-dialog-actions">
            <button aria-label="Thu nhỏ ảnh" disabled={imageZoom <= 1} onClick={() => setImageZoom((zoom) => Math.max(1, zoom - 0.5))} type="button">−</button>
            <span aria-live="polite">{Math.round(imageZoom * 100)}%</span>
            <button aria-label="Phóng to ảnh" disabled={imageZoom >= 3} onClick={() => setImageZoom((zoom) => Math.min(3, zoom + 0.5))} type="button">+</button>
            <button aria-label="Đóng ảnh" onClick={() => imageDialogRef.current.close()} ref={imageCloseRef} type="button">×</button>
          </div>
        </div>
        {selectedImage && (
          <div className="image-dialog-viewport">
            <img alt={selectedImage.alt} src={selectedImage.src} style={{ width: `${imageZoom * 100}%` }} />
          </div>
        )}
      </dialog>
    </div>
  );
}

export { HomePage };
