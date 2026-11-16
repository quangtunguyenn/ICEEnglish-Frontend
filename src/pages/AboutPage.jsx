import { Link } from "react-router-dom";
import { useMarketingMotion } from "../hooks/useMarketingMotion";
import "./AboutPage.css";

const principles = [
  {
    letter: "I",
    name: "Innovative",
    meaning: "Liên tục cải tiến",
    description:
      "Chúng tôi không ngừng cải tiến công nghệ và hệ thống bài giảng, để mỗi trải nghiệm học tập ngày càng rõ ràng, thuận tiện và phù hợp hơn với học sinh.",
    detail: "CẢI TIẾN CÔNG NGHỆ · BÀI GIẢNG",
  },
  {
    letter: "C",
    name: "Creative",
    meaning: "Sáng tạo trong cách học",
    description:
      "ICE tìm tòi phương pháp giảng dạy và truyền đạt sáng tạo, khuyến khích tư duy khai phóng để học sinh không chỉ ghi nhớ mà còn hiểu và chủ động khám phá.",
    detail: "PHƯƠNG PHÁP · TƯ DUY KHAI PHÓNG",
  },
  {
    letter: "E",
    name: "Effective",
    meaning: "Hiệu quả thực chất",
    description:
      "Hiệu quả được thể hiện qua giá trị mang đến cho học sinh: kiến thức vững hơn, kỹ năng tốt hơn và khả năng nhìn lại sự tiến bộ trên hành trình của mình.",
    detail: "GIÁ TRỊ · SỰ TIẾN BỘ",
  },
];

export function AboutPage() {
  const pageRef = useMarketingMotion();

  return (
    <div className="about-page" ref={pageRef}>
      <section aria-labelledby="about-title" className="about-hero">
        <div className="about-shell about-hero-layout" data-page-hero>
          <div className="about-hero-copy">
            <span className="about-kicker"><span aria-hidden="true" /> CÂU CHUYỆN ICE ENGLISH</span>
            <h1 id="about-title">Vững kiến thức.<br /><em>Vững vàng tâm thế.</em></h1>
            <p>
              Chúng tôi tin rằng sự chuẩn bị cho một kỳ thi không chỉ bắt đầu
              từ những trang sách, mà còn từ sự tự tin của mỗi học sinh.
            </p>
            <a className="about-hero-link" href="#cau-chuyen">Câu chuyện của chúng tôi <span aria-hidden="true">↓</span></a>
          </div>
          <div className="about-hero-art">
            <div aria-hidden="true" className="about-hero-ring about-hero-ring--outer" />
            <div aria-hidden="true" className="about-hero-ring about-hero-ring--inner" />
            <div className="about-hero-emblem">
              <img alt="" src="/ice_english_emblem_vector.svg" />
              <span>INNOVATIVE · CREATIVE · EFFECTIVE</span>
            </div>
            <span className="about-hero-note" data-page-float><i aria-hidden="true" /> Lấy học sinh làm trung tâm</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="about-story-title" className="about-story" id="cau-chuyen">
        <div className="about-shell about-story-layout" data-page-reveal>
          <div>
            <span className="about-eyebrow">ĐIỀU ĐƯA CHÚNG TÔI BẮT ĐẦU</span>
            <h2 id="about-story-title">Đằng sau mỗi kỳ thi<br /><span>là một con người.</span></h2>
          </div>
          <div className="about-story-copy">
            <p>
              ICE English là tổ chức giáo dục được thành lập với mục tiêu giúp
              các bạn thí sinh THPTQG có hành trang vững vàng về kiến thức và
              tâm lý trước khi bước vào kỳ thi thật.
            </p>
            <p>
              Chúng tôi lựa chọn một triết lý giáo dục tập trung vào con người,
              lấy học sinh làm trung tâm. Bởi mỗi bạn có một xuất phát điểm,
              mục tiêu và cách tiến bộ riêng — điều quan trọng là có một hành
              trình học tập rõ ràng và sự đồng hành phù hợp.
            </p>
            <div className="about-story-signature">
              <span aria-hidden="true" />
              <strong>Con người trước tiên.<br />Tiến bộ từng ngày.</strong>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="about-values-title" className="about-values">
        <div className="about-shell">
          <div className="about-section-heading" data-page-reveal>
            <span className="about-eyebrow">BA CHỮ CÁI · MỘT ĐỊNH HƯỚNG</span>
            <h2 id="about-values-title">ICE là điều thúc đẩy<br /><span>chúng tôi tiến về phía trước.</span></h2>
            <p>Ba giá trị trong tên gọi cũng là cách chúng tôi suy nghĩ, xây dựng và hoàn thiện trải nghiệm học tập mỗi ngày.</p>
          </div>
          <div className="about-values-grid">
            {principles.map((principle) => (
              <article className="about-value-card" data-page-reveal key={principle.letter}>
                <span aria-hidden="true" className="about-value-letter">{principle.letter}</span>
                <div className="about-value-copy">
                  <span className="about-value-name">{principle.name}</span>
                  <h3>{principle.meaning}</h3>
                  <p>{principle.description}</p>
                  <span className="about-value-detail">{principle.detail}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="about-course-title" className="about-course">
        <div className="about-shell about-course-layout" data-page-reveal>
          <div>
            <span className="about-eyebrow">HÀNH TRÌNH HỌC TẬP CÙNG ICE</span>
            <h2 id="about-course-title">Từ triết lý<br /><span>đến từng trải nghiệm.</span></h2>
            <p>
              Hiện tại, ICE English đồng hành cùng học sinh qua ICE Masterclass:
              kết nối bài giảng, luyện đề, phòng thi ảo và theo dõi tiến bộ trong
              một hành trình ôn thi.
            </p>
          </div>
          <article className="about-course-card">
            <div className="about-course-card-top"><span>KHÓA HỌC HIỆN CÓ</span><img alt="" src="/ice_english_emblem_vector.svg" /></div>
            <h3>ICE<br />Masterclass<span>.</span></h3>
            <p>Học kiến thức trọng tâm. Luyện tập có định hướng. Tự tin tiến đến ngày thi.</p>
            <Link to="/khoa-hoc/ice-masterclass">Tìm hiểu ICE Masterclass <span aria-hidden="true">↗</span></Link>
          </article>
        </div>
      </section>

      <section aria-labelledby="about-commitment-title" className="about-commitment mb-40">
        <div className="about-shell about-commitment-layout" data-page-reveal>
          <div>
            <span className="about-kicker"><span aria-hidden="true" /> CAM KẾT CỦA ICE ENGLISH</span>
            <h2 id="about-commitment-title">Trọn vẹn trong từng<br /><em>bước đồng hành.</em></h2>
          </div>
          <div className="about-commitment-copy">
            <p>
              ICE English cam kết mang đến trải nghiệm học tập trọn vẹn cho
              học sinh: từ kiến thức, công cụ luyện tập đến việc nhìn lại tiến
              bộ. Chúng tôi sẽ tiếp tục lắng nghe, cải tiến và đặt người học
              ở trung tâm của mọi điều mình xây dựng.
            </p>
            <Link to="/#tu-van">Trao đổi cùng ICE English <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
