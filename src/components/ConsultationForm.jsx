import { useId, useRef, useState } from "react";
import { createConsultationRequest, getApiErrorMessage } from "../services/api";
import { validateConsultation } from "../utils/consultationValidation";
import "./ConsultationForm.css";

export function ConsultationForm() {
  const noticeId = useId();
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const dialogRef = useRef(null);
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (pendingRef.current) return;
    const form = event.currentTarget;
    const vietnamYear = Number(new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric" }).format(new Date()));
    const result = validateConsultation(new FormData(form), vietnamYear);
    if (result.error) {
      setMessage({ field: result.field, text: result.error });
      form.elements.namedItem(result.field)?.focus();
      return;
    }

    pendingRef.current = true;
    setPending(true);
    setMessage(null);
    try {
      await createConsultationRequest(result.payload);
    } catch (error) {
      setMessage({ text: getApiErrorMessage(error, "Không thể gửi yêu cầu tư vấn. Vui lòng thử lại.") });
      return;
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
    form.reset();
    dialogRef.current?.showModal();
  }

  return (
    <form aria-describedby={message ? noticeId : undefined} className="consultation-form" noValidate onChange={() => message && setMessage(null)} onSubmit={handleSubmit}>
      <div className="consultation-form-heading">
        <span className="consultation-form-eyebrow">THÔNG TIN TƯ VẤN</span>
        <h3>ICE Masterclass</h3>
        <p>Vui lòng điền thông tin của học sinh và số điện thoại liên hệ.</p>
      </div>

      {message && <p className="consultation-notice is-error" id={noticeId} role="alert">{message.text}</p>}

      <fieldset className="consultation-fields" disabled={pending}>
        <label>
          <span>Họ và tên học sinh</span>
          <input aria-describedby={message?.field === "studentName" ? noticeId : undefined} aria-invalid={message?.field === "studentName" || undefined} autoComplete="name" maxLength="150" name="studentName" placeholder="Nhập họ và tên" required type="text" />
        </label>
        <label>
          <span>Năm sinh học sinh</span>
          <input aria-describedby={message?.field === "birthYear" ? noticeId : undefined} aria-invalid={message?.field === "birthYear" || undefined} autoComplete="bday-year" min="1" name="birthYear" placeholder="Ví dụ: 2008" required step="1" type="number" />
        </label>
        <label>
          <span>Mục tiêu điểm số</span>
          <input aria-describedby={message?.field === "targetScore" ? noticeId : undefined} aria-invalid={message?.field === "targetScore" || undefined} inputMode="decimal" max="10" min="0" name="targetScore" placeholder="Ví dụ: 8.5" required step="any" type="number" />
        </label>
        <label>
          <span>Số điện thoại phụ huynh / học sinh</span>
          <input aria-describedby={message?.field === "phone" ? noticeId : undefined} aria-invalid={message?.field === "phone" || undefined} autoComplete="tel" inputMode="numeric" name="phone" placeholder="Nhập 10 chữ số" required type="tel" />
        </label>
        <label className="consultation-course">
          <span>Nội dung tư vấn</span>
          <input name="course" readOnly type="text" value="Tư vấn khóa học ICE Masterclass" />
        
        </label>
      </fieldset>

      <button disabled={pending} type="submit">{pending ? "Đang gửi..." : "Gửi thông tin tư vấn"} <span aria-hidden="true">→</span></button>

      <dialog
        aria-describedby={dialogDescriptionId}
        aria-labelledby={dialogTitleId}
        className="consultation-dialog"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            dialogRef.current?.close();
          }
        }}
        ref={dialogRef}
      >
        <div aria-hidden="true" className="consultation-dialog-icon">✓</div>
        <h2 id={dialogTitleId}>Cảm ơn bạn đã tin tưởng ICE!</h2>
        <p id={dialogDescriptionId}>Yêu cầu tư vấn đã được gửi thành công. ICE English sẽ sớm liên hệ với bạn.</p>
        <button onClick={() => dialogRef.current?.close()} type="button">Đóng</button>
      </dialog>
    </form>
  );
}
