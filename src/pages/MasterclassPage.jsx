import { Link } from "react-router-dom";
import { useMarketingMotion } from "../hooks/useMarketingMotion";
import "./MasterclassPage.css";

const learningFeatures = [
  {
    number: "01",
    label: "HỌC KIẾN THỨC",
    title: "Học có trọng tâm, nhớ bằng thực hành",
    description:
      "Hệ thống bài giảng tập trung vào kiến thức trọng tâm, đi cùng các bộ từ vựng theo chủ đề. Bài tập về nhà giúp ôn lại bài giảng, còn flashcard sinh động giúp việc ghi nhớ từ vựng trở nên chủ động hơn.",
    image: "/bai-giang.png",
    alt: "Giao diện bài giảng video và danh sách chuyên đề trên ICE English",
    tags: ["Bài giảng trọng tâm", "Bài tập về nhà", "Từ vựng & flashcard"],
    link: "/video",
    action: "Khám phá bài giảng",
  },
  {
    number: "02",
    label: "LÀM QUEN PHÒNG THI",
    title: "Luyện thao tác trước ngày thi",
    description:
      "Phòng thi ảo được xây dựng theo sát giao diện do Bộ Giáo dục và Đào tạo công bố. Từ đăng nhập, chọn đáp án đến quản lý thời gian, học sinh có thể làm quen từng thao tác để tự tin hơn khi bước vào kỳ thi.",
    image: "/phong-thi-ao.png",
    alt: "Giao diện phòng thi ảo với bài đọc, câu hỏi và đồng hồ làm bài",
    tags: ["Giao diện mô phỏng", "Luyện tập bấm giờ"],
    link: "/thi-thu",
    action: "Trải nghiệm phòng thi",
  },
  {
    number: "03",
    label: "NHÌN LẠI & TIẾN BỘ",
    title: "Mỗi bài làm là một cơ hội hiểu mình hơn",
    description:
      "Xem kết quả trực quan, đáp án và gợi ý video ôn tập kiến thức liên quan. Biểu đồ điểm số và lịch sử làm đề giúp học sinh theo dõi sự tiến bộ qua từng bài thi và nhận ra phần cần cải thiện.",
    image: "/chi-tiet-ket-qua.png",
    alt: "Giao diện kết quả thi thử và thời gian làm từng phần",
    tags: ["Kết quả trực quan", "Video ôn tập", "Biểu đồ & lịch sử"],
    link: "/thi-thu",
    action: "Tìm hiểu thi thử",
  },
  {
    number: "04",
    label: "TRAU DỒI ĐỌC HIỂU",
    title: "Đọc nhiều hơn, hiểu sâu hơn",
    description:
      "Thư viện đọc hiểu sử dụng bài đọc từ các nguồn uy tín, giúp học sinh tiếp xúc với nhiều chủ đề và trau dồi kỹ năng đọc hiểu cùng vốn từ trong ngữ cảnh.",
    image: "/thu-vien.png",
    alt: "Giao diện thư viện bài đọc của ICE English",
    tags: ["Chủ đề đa dạng", "Từ vựng trong ngữ cảnh"],
    link: "/doc-hieu",
    action: "Khám phá thư viện",
  },
];

export function MasterclassPage() {
  const pageRef = useMarketingMotion();

  return (
    <div className="masterclass-page" ref={pageRef}>
      <section aria-labelledby="masterclass-title" className="masterclass-hero">
        <div className="masterclass-shell masterclass-hero-layout" data-page-hero>
          <div className="masterclass-hero-copy">
            <span className="masterclass-kicker"><span aria-hidden="true" /> ICE ENGLISH · MASTERCLASS</span>
            <h1 id="masterclass-title">Một hành trình ôn thi.<br /><em>Rõ ràng từng bước.</em></h1>
            <p>
              Từ xây nền kiến thức, luyện đề đến làm quen phòng thi và nhìn lại
              tiến bộ — ICE Masterclass đồng hành cùng bạn trên hành trình chinh
              phục kỳ thi tiếng Anh THPT.
            </p>
            <div className="masterclass-actions">
              <a className="masterclass-button masterclass-button--gold" href="#gia-tri">
                Khám phá khóa học <span aria-hidden="true">↓</span>
              </a>
              <Link className="masterclass-text-link" to="/#tu-van">Trao đổi cùng ICE <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
          <aside aria-label="Thông tin khóa học" className="masterclass-price-card" data-page-float>
            <div className="masterclass-price-top">
              <span>ICE MASTERCLASS</span>
              <img alt="" src="/ice_english_emblem_vector.svg" />
            </div>
            <p className="masterclass-price-label">Học phí khóa học</p>
            <p className="masterclass-price">699.000 <span>VND</span></p>
            <p className="masterclass-price-description">Một lộ trình kết nối việc học, luyện tập và theo dõi tiến bộ.</p>
            <div className="masterclass-price-divider" />
            <div className="masterclass-price-row"><span>Học</span><strong>Kiến thức &amp; từ vựng</strong></div>
            <div className="masterclass-price-row"><span>Luyện</span><strong>Đề thi &amp; phòng thi ảo</strong></div>
            <div className="masterclass-price-row"><span>Tiến bộ</span><strong>Chữa đề &amp; nhìn lại</strong></div>
          </aside>
        </div>
        <div className="masterclass-shell masterclass-rhythm" aria-label="Nhịp học và luyện tập">
          <div><strong>02</strong><span>đề luyện tập<br />mỗi tuần</span></div>
          <div><strong>03</strong><span>buổi chữa đề online<br />mỗi tuần</span></div>
          <div><strong>~40</strong><span>đề tăng cường<br />giai đoạn nước rút</span></div>
        </div>
      </section>

      <section aria-labelledby="masterclass-values-title" className="masterclass-values" id="gia-tri">
        <div className="masterclass-shell">
          <div className="masterclass-section-heading" data-page-reveal>
            <span className="masterclass-eyebrow">GIÁ TRỊ KHÓA HỌC</span>
            <h2 id="masterclass-values-title">Học, luyện và tiến bộ.<br /><span>Trên cùng một hành trình.</span></h2>
            <p>Không chỉ dừng lại ở việc giải đề, mỗi phần trong khóa học được kết nối để bạn hiểu kiến thức, luyện kỹ năng và nhìn rõ sự tiến bộ của mình.</p>
          </div>
          <div className="masterclass-feature-list">
            {learningFeatures.map((feature) => (
              <article className="masterclass-feature" data-page-reveal key={feature.number}>
                <div className="masterclass-feature-copy">
                  <div className="masterclass-feature-index"><span>{feature.number}</span>{feature.label}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <ul className="masterclass-tags">
                    {feature.tags.map((tag) => <li key={tag}>{tag}</li>)}
                  </ul>
                  <Link className="masterclass-feature-link" to={feature.link}>{feature.action} <span aria-hidden="true">↗</span></Link>
                </div>
                <figure className="masterclass-feature-image">
                  <div className="masterclass-image-bar"><span aria-hidden="true">● ● ●</span> ICE ENGLISH</div>
                  <img alt={feature.alt} decoding="async" loading="lazy" src={feature.image} />
                </figure>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="masterclass-practice-title" className="masterclass-practice">
        <div className="masterclass-shell">
          <div className="masterclass-practice-heading" data-page-reveal>
            <div>
              <span className="masterclass-eyebrow">LUYỆN ĐỀ CÓ ĐỒNG HÀNH</span>
              <h2 id="masterclass-practice-title">Luyện đều hôm nay.<br /><span>Vững vàng ngày mai.</span></h2>
            </div>
            <p>Giữ nhịp luyện tập xuyên suốt, được chữa đề cùng giảng viên và tăng cường đúng thời điểm trước kỳ thi.</p>
          </div>
          <div className="masterclass-practice-grid">
            <article data-page-reveal>
              <span className="masterclass-practice-number">01 / NHỊP LUYỆN TẬP</span>
              <h3>Đều đặn mỗi tuần</h3>
              <p>Luyện <strong>2 đề mỗi tuần</strong> và tham gia <strong>1 đề đánh giá năng lực thường xuyên</strong> để nhìn lại năng lực của mình.</p>
            </article>
            <article data-page-reveal>
              <span className="masterclass-practice-number">02 / CÙNG GIẢNG VIÊN</span>
              <h3>Hiểu sâu qua chữa đề</h3>
              <p>Tham gia <strong>3 buổi chữa đề online mỗi tuần</strong> cùng giảng viên, củng cố cách làm và kiến thức sau khi luyện tập.</p>
            </article>
            <article data-page-reveal>
              <span className="masterclass-practice-number">03 / GIAI ĐOẠN NƯỚC RÚT</span>
              <h3>Tăng tốc trước kỳ thi</h3>
              <p>Tăng cường khoảng <strong>40 đề</strong> và giải đề từ các Sở Giáo dục và Đào tạo. Đề được phân tích và cải tiến liên tục.</p>
            </article>
          </div>
        </div>
      </section>

      <section aria-labelledby="masterclass-next-title" className="masterclass-next">
        <div className="masterclass-shell masterclass-next-layout" data-page-reveal>
          <div>
            <span className="masterclass-eyebrow">ĐỒNG HÀNH CÙNG ICE ENGLISH</span>
            <h2 id="masterclass-next-title">Bắt đầu từ một<br /><span>mục tiêu rõ ràng.</span></h2>
            <p>Nếu bạn muốn tìm hiểu thêm về lộ trình, hãy chia sẻ mục tiêu của mình với ICE English.</p>
          </div>
          <Link className="masterclass-button masterclass-button--navy" to="/#tu-van">
            Tìm hiểu tư vấn khóa học <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
