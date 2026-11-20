import { Link } from "react-router-dom";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMarketingMotion } from "../hooks/useMarketingMotion";
import "./HonorsPage.css";


const students = [
  {
    name: "Lê Duy Mạnh Phước",
    before: "6.8",
    after: "8.75",
    image: "/Lê Duy Mạnh Phước.jpg",
    feedback: "Điều em thấy khác biệt khi học tại ICE English là kiến thức được hệ thống rất chắc chắn và bài bản. Anh bắt đầu từ những kiến thức nền tảng, sau đó nâng dần độ khó để tụi em có thể tiếp thu một cách dễ dàng. Em còn được hướng dẫn hiểu rõ bản chất của từng dạng câu hỏi cũng như những mẹo làm bài nhanh và chính xác. Không chỉ dừng lại ở những buổi học trên lớp, anh còn ghi lại video bài giảng để tụi em có thể xem lại và ôn tập tại nhà. Tài liệu học tập cũng rất thực tế, bám sát cấu trúc đề thi THPT Quốc gia. Em nghĩ ICE English là một lựa chọn rất tốt cho những bạn muốn cải thiện điểm số và chuẩn bị thật tốt cho kỳ thi THPT Quốc gia ạ!",
  },
  {
    name: "Nguyễn Phương Trang",
    before: "7.3",
    after: "8.75",
    image: "/Nguyễn Phương Trang.jpg",
    feedback: "Sau khi tham gia khóa học tại ICE English và kiên trì ôn tập theo lộ trình của anh, điểm môn Tiếng Anh của em đã được cải thiện đáng kể. Em cảm thấy tự tin hơn rất nhiều khi làm bài và vận dụng kiến thức ạ!",
  },
  {
    name: "Nguyễn Thanh Xuân",
    before: "8",
    after: "8.5",
    image: "/Nguyễn Thanh Xuân.jpg",
  },
  {
    name: "Nguyễn Thiên Quỳnh Anh",
    before: "7.3",
    after: "8",
    image: "/Nguyễn Thiên Quỳnh Anh.jpg",
  },
  {
    name: "Huỳnh Nguyễn Quỳnh Anh",
    before: "9.4",
    after: "9.5",
  },
  {
    name: "Nguyễn Như Hà Anh",
    after: "8.5",
  },
  {
    name: "Lê Hà Khánh Ly",
    after: "8",
    image: "/Lê Hà Khánh Ly.jpg",
  },
  {
    name: "Nguyễn Viết Trung Nguyên",
    before: "6.5",
    after: "9",
    image: "/Nguyễn Viết Trung Nguyên.jpg",
    feedback: "Em thấy phương pháp học tại ICE English khá hiệu quả, đặc biệt là những buổi học đầu tiên giúp em củng cố lại kiến thức căn bản và lấy lại nền tảng Tiếng Anh. Trong suốt quá trình học, anh cũng thường xuyên lồng ghép và nhắc lại những kiến thức cũ để tụi em không bị quên và có thể vận dụng tốt hơn khi làm bài. Em nghĩ khóa học rất phù hợp với những bạn có nền tảng kiến thức chưa vững hoặc đang muốn lấy lại gốc Tiếng Anh ạ!",
  },
  {
    name: "Nguyễn Kim Bảo Ngọc",
    before: "8.25",
    after: "8.75",
    image: "/Nguyễn Kim Bảo Ngọc.jpg",
    feedback: "Theo cá nhân em, khóa học tại ICE English rất hiệu quả. Tài liệu được cung cấp đầy đủ, nội dung bài học được xây dựng bài bản, chi tiết và bám sát thực tế. Bên cạnh đó, anh giảng dạy rất dễ hiểu, luôn sẵn sàng giải đáp những thắc mắc và truyền cho tụi em rất nhiều động lực trong quá trình học tập. Em cảm thấy mình không chỉ cải thiện được kiến thức mà còn có thêm sự tự tin khi học môn Tiếng Anh ạ!",
  },
  {
    name: "Nguyễn Bảo Nhi",
    before: "7.8",
    after: "8.75",
    image: "/Nguyễn Bảo Nhi.jpg",
  },
  {
    name: "Tô Hoàng Ngọc Trâm",
    before: "4.6",
    after: "7",
    image: "/Tô Hoàng Ngọc Trâm.jpg",
    feedback: "Dạ, trước khi học tại ICE English, em chỉ đạt 4.6 điểm môn Tiếng Anh. Sau một thời gian học và ôn tập, em đã cải thiện lên 7 điểm. Anh dạy rất dễ hiểu, nhiệt tình và có tâm, đặc biệt là phần chữa bài rất chi tiết nên em hiểu rõ lỗi sai của mình và tiến bộ hơn nhiều ạ!",
  },
];


function StudentCard({ student }) {
  return (
    <article className="honors-student-card" data-page-reveal>
      <div className="honors-student-heading">
        <span className="honors-student-label">VINH DANH HỌC SINH ICE</span>
        <img alt="" aria-hidden="true" className="honors-student-logo" src="/ice_english_emblem_vector.svg" />
      </div>
      <h3>{student.name}</h3>
      <div className="honors-poster-grid">
        <div className="honors-poster-copy">
          <dl className="honors-scores">
            <div>
              <dt>Trước khi học</dt>
              <dd className={student.before ? undefined : "honors-score-missing"}>{student.before ?? "-"}</dd>
            </div>
            <div>
              <dt>Giữa kỳ 1 sau khi học</dt>
              <dd>{student.after}</dd>
            </div>
          </dl>
          {student.feedback ? (
            <div aria-hidden="true" className="honors-quote-preview">
              <span>CHIA SẺ TỪ HỌC SINH</span>
              <p>{student.feedback}</p>
            </div>
          ) : (
            <p className="honors-card-message">Ghi nhận từng nỗ lực trên hành trình học tập.</p>
          )}
        </div>
        <div className="honors-portrait">
          {student.image ? (
            <img alt={`Ảnh của ${student.name}`} decoding="async" loading="lazy" src={student.image} />
          ) : (
            <span aria-hidden="true">{student.name.split(" ").at(-1).charAt(0)}</span>
          )}
        </div>
      </div>
      {student.feedback && (
        <details className="honors-feedback" onToggle={() => ScrollTrigger.refresh()}>
          <summary>Đọc đầy đủ chia sẻ của {student.name}</summary>
          <blockquote>{student.feedback}</blockquote>
        </details>
      )}
    </article>
  );
}

export function HonorsPage() {
  const pageRef = useMarketingMotion();

  return (
    <div className="honors-page" ref={pageRef}>
      <section aria-labelledby="honors-title" className="honors-hero">
        <div className="honors-shell honors-hero-layout" data-page-hero>
          <div>
            <span className="honors-kicker"><span aria-hidden="true" /> VINH DANH HỌC SINH ICE</span>
            <h1 id="honors-title">Mỗi nỗ lực đều<br /><em>xứng đáng được ghi nhận.</em></h1>
            <p>
              Phía sau mỗi điểm số là một hành trình học tập, sự kiên trì và
              những bước tiến của riêng mỗi bạn. ICE trân trọng chia sẻ những
              dấu mốc ấy cùng các học sinh của mình.
            </p>
            <a className="honors-hero-link" href="#ky-vinh-danh">Khám phá kỳ vinh danh <span aria-hidden="true">↓</span></a>
          </div>
          <div aria-hidden="true" className="honors-hero-art">
            <div className="honors-hero-ring" />
            <div className="honors-hero-mark">
              <span>ICE ENGLISH</span>
              <strong>Những bước tiến<br /><em>đáng tự hào.</em></strong>
              <div />
              <small>GHI NHẬN · ĐỒNG HÀNH · TIẾN BỘ</small>
            </div>
            <span className="honors-hero-spark" data-page-float>✦</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="honors-editions-title" className="honors-editions" id="ky-vinh-danh">
        <div className="honors-shell">
          <div className="honors-section-heading" data-page-reveal>
            <span className="honors-eyebrow">NHỮNG DẤU MỐC CÙNG ICE</span>
            <h2 id="honors-editions-title">Mỗi kỳ vinh danh,<br /><span>một câu chuyện tiến bộ.</span></h2>
            <p>Khám phá những thành tích và chia sẻ của học sinh ICE trong từng kỳ.</p>
          </div>
          <a className="honors-edition-card" data-page-reveal href="#giua-ky-1-2026-2027">
            <div>
              <span className="honors-edition-label">KỲ VINH DANH · 2026–2027</span>
              <h3>Điểm thi giữa kỳ 1<br />năm học 2026–2027</h3>
              <p>Ghi nhận thành quả học tập và những lời chia sẻ từ các bạn học sinh ICE.</p>
              <span className="honors-edition-action">Xem câu chuyện <span aria-hidden="true">↗</span></span>
            </div>
            <div aria-hidden="true" className="honors-edition-number"><small>GIỮA KỲ</small><strong>01</strong><span>2026 — 2027</span></div>
          </a>
        </div>
      </section>

      <section aria-labelledby="honors-students-title" className="honors-students" id="giua-ky-1-2026-2027">
        <div className="honors-shell">
          <div className="honors-students-heading" data-page-reveal>
            <div>
              <span className="honors-eyebrow">GIỮA KỲ 1 · NĂM HỌC 2026–2027</span>
              <h2 id="honors-students-title">Ghi nhận từng<br /><span>bước tiến.</span></h2>
            </div>
            <p>Điểm số và chia sẻ dưới đây ghi lại hành trình của từng học sinh. Mỗi xuất phát điểm là khác nhau, và mỗi nỗ lực đều đáng trân trọng.</p>
          </div>
          <div className="honors-student-grid">
            {students.map((student) => <StudentCard key={student.name} student={student} />)}
          </div>
        </div>
      </section>

      <section aria-labelledby="honors-next-title" className="honors-next mb-50">
        <div className="honors-shell honors-next-layout" data-page-reveal>
          <div>
            <span className="honors-kicker"><span aria-hidden="true" /> HÀNH TRÌNH TIẾP THEO</span>
            <h2 id="honors-next-title">Câu chuyện tiếp theo<br /><em>có thể là của bạn.</em></h2>
            <p>Hãy cùng ICE nỗ lực và trở thành một trong những học sinh được vinh danh trong những kỳ tuyển sinh tiếp theo.</p>
          </div>
          <Link className="honors-next-link" to="/khoa-hoc/ice-masterclass">Tìm hiểu ICE Masterclass <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </div>
  );
}
