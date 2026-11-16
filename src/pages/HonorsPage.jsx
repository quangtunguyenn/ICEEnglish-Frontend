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
    feedback: "em thấy học ở chỗ anh hơn những chỗ em từng học là được hệ thống các kiến thức rất chắc ,được bắt đầu ôn từ những kiến thức không quá xa lạ và từ từ tăng dần các level lên. Và em còn được anh chỉ rõ bản chất của những câu hỏi và những mẹo làm siêu nhanh mà chính xác. Và thay vì học một buổi cho xong một ngày mà anh còn tận tâm ghi lại những buổi video để có thể về nhà xem lại và ôn nếu có quên, những đề tài liệu mà anh đưa cho nó còn thực chiến trong THPT để mọi người làm quen dần. Nói chung em nghĩ nếu muốn ôn THPTQG và ở trên trường thì em thấy học anh vẫn rất ok",
  },
  {
    name: "Nguyễn Phương Trang",
    before: "7.3",
    after: "8.75",
    image: "/Nguyễn Phương Trang.jpg",
    feedback: "Sau khi em học và ôn tập theo khoá học của anh thì điểm môn tiếng anh của em cải thiện nhiều lắm ạ",
  },
  { name: "Nguyễn Thanh Xuân", before: "8", after: "8.5", image: "/Nguyễn Thanh Xuân.jpg" },
  { name: "Nguyễn Thiên Quỳnh Anh", before: "7.3", after: "8", image: "/Nguyễn Thiên Quỳnh Anh.jpg" },
  { name: "Huỳnh Nguyễn Quỳnh Anh", before: "9.4", after: "9.5" },
  { name: "Nguyễn Như Hà Anh", after: "8.5" },
  { name: "Lê Hà Khánh Ly", after: "8", image: "/Lê Hà Khánh Ly.jpg" },
  {
    name: "Nguyễn Viết Trung Nguyên",
    before: "6.5",
    after: "9",
    image: "/Nguyễn Viết Trung Nguyên.jpg",
    feedback: "với em thấy học bên anh khá ổn, những buổi đầu có lấy lại căn bản, kiến thức, lấy lại gốc. Trong suốt các buổi học sau cũng có gợi lại những bài học căn bản trong suốt quá trình học và ôn tập ạ, em thấy hợp với những bạn có kiến thức nền yếu hoặc mất gốc ạ",
  },
  {
    name: "Nguyễn Kim Bảo Ngọc",
    before: "8.25",
    after: "8.75",
    image: "/Nguyễn Kim Bảo Ngọc.jpg",
    feedback: "Theo cá nhân em khóa học này khá hiệu quả, tài liệu được cung cấp với nội dung khóa học rất bài bản, chi tiết và sát với thực tế  . Kèm theo đó là giảng viên dạy dễ hiểu, luôn sẵn sàng giải đáp các thắc mắc và truyền cảm hứng học tập rất nhiều đến với học sinh!",
  },
  { name: "Nguyễn Bảo Nhi", before: "7.8", after: "8.75", image: "/Nguyễn Bảo Nhi.jpg" },
  {
    name: "Tô Hoàng Ngọc Trâm",
    before: "4.6",
    after: "7",
    image: "/Tô Hoàng Ngọc Trâm.jpg",
    feedback: "Dạ trước khi học em được 4,6 điểm môn anh, sau học em lên 7 điểm. Anh dạy dễ hiểu, có tâm, chữa bài chi tiết nên em cải thiện nhiều lắm ạ",
  },
];

function StudentCard({ student }) {
  return (
    <article className="honors-student-card" data-page-reveal>
      <div className="honors-student-heading">
        <span className="honors-student-label">VINH DANH HỌC SINH ICE</span>
        <span aria-hidden="true" className="honors-student-spark">✦</span>
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
