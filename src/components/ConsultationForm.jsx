import { useId, useRef, useState } from "react";
import { createConsultationRequest, getApiErrorMessage } from "../services/api";
import "./ConsultationForm.css";

export function ConsultationForm() {
  const noticeId = useId();
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (pendingRef.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const studentFullname = String(values.get("studentName")).trim();
    const phoneNumberRequest = String(values.get("phone")).trim();
    const bod = Number(values.get("birthYear"));
    const targetGrade = Number(values.get("targetScore"));
    const vietnamYear = Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }).format(new Date()));
    if (!studentFullname || studentFullname.length > 150 || !phoneNumberRequest || phoneNumberRequest.length > 30 ||
        !values.get("birthYear") || !Number.isInteger(bod) || bod < 1 || bod > vietnamYear ||
        !values.get("targetScore") || !Number.isFinite(targetGrade) || targetGrade < 0 || targetGrade > 10) {
      setMessage({ error: true, text: "Vui lòng kiểm tra họ tên (tối đa 150 ký tự), năm sinh, điểm mục tiêu và số điện thoại (tối đa 30 ký tự)." });
      return;
    }

    pendingRef.current = true;
    setPending(true);
    setMessage(null);
    try {
      await createConsultationRequest({ studentFullname, bod, targetGrade, phoneNumberRequest });
      form.reset();
      setMessage({ error: false, text: "Đã gửi yêu cầu tư vấn thành công. ICE English sẽ liên hệ với bạn." });
    } catch (error) {
      setMessage({ error: true, text: getApiErrorMessage(error, "Không thể gửi yêu cầu tư vấn. Vui lòng thử lại.") });
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <form aria-describedby={message ? noticeId : undefined} className="consultation-form" onSubmit={handleSubmit}>
      <div className="consultation-form-heading">
        <span className="consultation-form-eyebrow">THÔNG TIN TƯ VẤN</span>
        <h3>ICE Masterclass</h3>
        <p>Vui lòng điền thông tin của học sinh và số điện thoại liên hệ.</p>
      </div>

      {message && <p className={`consultation-notice ${message.error ? "is-error" : "is-success"}`} id={noticeId} role={message.error ? "alert" : "status"}>{message.text}</p>}

      <fieldset className="consultation-fields" disabled={pending}>
        <label>
          <span>Họ và tên học sinh</span>
          <input autoComplete="name" name="studentName" placeholder="Nhập họ và tên" required type="text" />
        </label>
        <label>
          <span>Năm sinh học sinh</span>
          <input autoComplete="bday-year" min="1" name="birthYear" placeholder="Ví dụ: 2008" required step="1" type="number" />
        </label>
        <label>
          <span>Mục tiêu điểm số</span>
          <input inputMode="decimal" max="10" min="0" name="targetScore" placeholder="Ví dụ: 8.5" required step="any" type="number" />
        </label>
        <label>
          <span>Số điện thoại phụ huynh / học sinh</span>
          <input autoComplete="tel" inputMode="tel" name="phone" placeholder="Nhập số điện thoại liên hệ" required type="tel" />
        </label>
        <label className="consultation-course">
          <span>Nội dung tư vấn</span>
          <input name="course" readOnly type="text" value="Tư vấn khóa học ICE Masterclass" />
          <small>Nội dung này chỉ hiển thị tại đây, không được gửi tới hệ thống.</small>
        </label>
      </fieldset>

      <button disabled={pending} type="submit">{pending ? "Đang gửi..." : "Gửi thông tin tư vấn"} <span aria-hidden="true">→</span></button>
    </form>
  );
}
