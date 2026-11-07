# Yêu cầu backend cho tính năng trộn part (shuffle) theo từng lượt làm bài

## 1. Mục tiêu

Mỗi lần học sinh bấm bắt đầu làm đề (`startExam`), các part được xếp theo một thứ tự ngẫu nhiên.
Thứ tự này phải **cố định trong suốt lượt làm đó** (tải lại trang, mở lại bài, xem kết quả đều thấy cùng một thứ tự) và **khác nhau giữa các lượt/học sinh**.

Backend là nơi quyết định và lưu thứ tự. Frontend chỉ hiển thị theo thứ tự backend trả về.

## 2. Hiện trạng frontend (để backend biết cách gọi)

| Bước | API đang dùng | Ghi chú |
|---|---|---|
| Bắt đầu lượt làm | `POST /api/v1/submissions/start/{examId}` | Trả `submissionId`. Mock exam khôi phục `submissionId` từ localStorage nếu đã có |
| Lấy nội dung đề | `GET /api/v1/exams/{examId}` | Hiện **không** gắn với `submissionId` nên không biết lượt nào |
| Nộp bài | `POST /api/v1/submissions/submit` | Gửi đáp án theo `question.id` |
| Log thời gian part | `GET /api/v1/submissions/{submissionId}/part-logs` | Theo `partId` |
| Kết quả | Dữ liệu result theo submission | Nhóm câu hỏi theo `partId` |

Đáp án, draft và log thời gian ở frontend đều khóa theo `part.id` / `question.id`, không theo vị trí, nên đổi thứ tự không làm lệch dữ liệu.

## 3. Thay đổi cần ở dữ liệu import (JSON đề)

Thêm các trường tùy chọn (mặc định giữ hành vi cũ):

```json
{
  "exam": {
    "title": "...",
    "exam_type": "MOCK",
    "duration_minutes": 50,
    "is_answers_revealed": false,
    "shuffle_parts": true
  },
  "parts": [
    {
      "part_name": "Part 1: ...",
      "part_type": "CLOZE_TEST",
      "order_index": 1,
      "shuffle_group": "A",
      "fixed_position": false,
      "questions": []
    }
  ]
}
```

| Trường | Cấp | Kiểu | Mặc định | Ý nghĩa |
|---|---|---|---|---|
| `shuffle_parts` | exam | boolean | `false` | Bật trộn part cho đề này |
| `fixed_position` | part | boolean | `false` | `true` = part luôn giữ nguyên vị trí `order_index`, không bị trộn |
| `shuffle_group` | part | string/null | `null` | (Tùy chọn) Chỉ trộn các part cùng nhóm với nhau; part khác nhóm không đổi chỗ sang nhóm khác. `null` = một nhóm chung |

Backend cần: lưu các trường trên khi import, trả lại ở API đề/preview, cho phép giáo viên bật tắt (nếu có màn hình quản lý).

## 4. Thuật toán trộn

1. Lấy danh sách part của đề, sắp theo `order_index` gốc.
2. Part có `fixed_position = true` giữ nguyên vị trí.
3. Các part còn lại (theo từng `shuffle_group`) được hoán vị ngẫu nhiên vào các vị trí còn trống của chính nhóm đó (Fisher–Yates).
4. Lưu kết quả là danh sách `part_id` theo thứ tự hiển thị, gắn với `submission_id`.
5. Chỉ sinh **một lần** khi tạo submission; không sinh lại khi gọi lại `GET`.

Mock exam: frontend khôi phục `submissionId` cũ khi học sinh tải lại trang nên backend phải trả đúng thứ tự đã lưu cho submission đó.

## 5. Lưu trữ

Thêm bảng (hoặc cột JSON) gắn với submission, ví dụ:

```
submission_part_order
  submission_id   (FK)
  part_id         (FK)
  display_index   (1..N)   -- vị trí hiển thị
  PRIMARY KEY (submission_id, part_id)
```

Với đề không bật shuffle hoặc submission cũ không có bản ghi: trả thứ tự theo `order_index` gốc.

## 6. API cần có / thay đổi

### 6.1 `POST /api/v1/submissions/start/{examId}`

Tạo submission và sinh thứ tự part (nếu `shuffle_parts = true`). Response bổ sung:

```json
{
  "submissionId": "...",
  "mode": "MOCK",
  "partOrder": ["part-id-3", "part-id-1", "part-id-2"]
}
```

Nếu cùng học sinh bắt đầu lại và hệ thống tái sử dụng submission đang làm dở, trả lại đúng `partOrder` đã lưu.

### 6.2 Lấy đề theo lượt làm (một trong hai phương án)

**Phương án A (ưu tiên, ít sửa frontend):** thêm tham số:

```
GET /api/v1/exams/{examId}?submissionId={submissionId}
```

Trả `parts` đã được sắp theo thứ tự của submission đó. Mỗi part có thêm `displayIndex` (1..N). Không truyền `submissionId` thì trả thứ tự gốc như hiện tại.

**Phương án B:** giữ `GET /exams/{examId}` như cũ, frontend tự sắp lại theo `partOrder` từ `start`.

Cần xác định quyền: học sinh chỉ được lấy `partOrder` của submission thuộc chính mình.

### 6.3 Kết quả và log

- API kết quả của submission trả `parts` (hoặc từng câu) kèm `partDisplayIndex` theo thứ tự lượt đó.
- `GET /api/v1/submissions/{submissionId}/part-logs` trả theo thứ tự hiển thị (hoặc kèm `displayIndex`).

### 6.4 Preview / import (staff)

- `GET /api/v1/exams/{id}/preview` luôn trả thứ tự gốc, kèm `shuffle_parts`, `fixed_position`, `shuffle_group`.
- `POST /api/v1/exams/import` nhận và lưu các trường ở mục 3; từ chối dữ liệu không hợp lệ (ví dụ `shuffle_group` rỗng chuỗi).

## 7. Quy tắc nội dung (cần thống nhất)

- Số câu hiển thị (`Question N`) sẽ được frontend đánh lại theo thứ tự câu sau khi trộn. Nếu `content` JSON viết cứng `**Question 7.**`, frontend cần backend/giáo viên **bỏ số cứng** khi bật shuffle, hoặc quy ước một placeholder, ví dụ `**Question {{n}}.**`.
- `order_index` của câu hỏi: giữ nguyên giá trị gốc trong DB; backend có thể trả thêm `displayNumber` (1..tổng số câu) đã tính theo thứ tự part mới. Nếu backend tính sẵn thì frontend không phải tự đếm.
- Các part có phụ thuộc nhau (ví dụ chung một bài đọc dài hoặc số câu liên tiếp theo nội dung) phải đặt `fixed_position = true` hoặc cùng `shuffle_group` riêng.
- Câu hỏi trong mỗi part **không** bị trộn (chỉ trộn part), trừ khi có yêu cầu thêm.

## 8. Tiêu chí nghiệm thu (backend)

1. Hai submission khác nhau của cùng một đề (bật shuffle) có thể ra thứ tự part khác nhau.
2. Gọi lại API đề/kết quả nhiều lần với cùng `submissionId` luôn ra cùng thứ tự.
3. Part `fixed_position = true` luôn đứng đúng vị trí gốc.
4. Đề không bật shuffle, và submission cũ chưa có bản ghi thứ tự, hoạt động y như hiện tại.
5. Học sinh không xem được thứ tự của submission người khác.
6. Staff preview luôn là thứ tự gốc.
7. Chấm điểm và thống kê không phụ thuộc thứ tự (đáp án theo `question.id`).

## 9. Việc frontend sẽ làm khi backend sẵn sàng

- Gọi `GET /exams/{examId}?submissionId=...` (hoặc sắp theo `partOrder`) và render `parts` theo thứ tự trả về.
- Đánh số câu theo `displayNumber` hoặc đếm theo thứ tự part, thay cho `orderIndex` gốc, ở trang làm bài, trang kết quả và bảng điều hướng câu.
- Hỗ trợ placeholder số câu trong `content` nếu được thống nhất.
- Thêm trường `shuffle_parts`, `fixed_position`, `shuffle_group` vào file JSON mẫu `docs/exam-import-sample.json` sau khi backend chốt tên trường.

## 10. Câu hỏi cần backend xác nhận

1. Chọn phương án A hay B ở mục 6.2?
2. Tên trường cuối cùng (`shuffle_parts`, `fixed_position`, `shuffle_group`) và kiểu JSON import?
3. Mock exam khôi phục submission cũ có cho phép bắt đầu lại với thứ tự mới không, hay luôn giữ nguyên?
4. Backend tính sẵn `displayNumber` cho từng câu, hay để frontend tự đếm?
5. Shuffle áp dụng cho loại đề nào: chỉ `MOCK`, hay cả `GENERAL_EXAM` và `HOMEWORK`?
