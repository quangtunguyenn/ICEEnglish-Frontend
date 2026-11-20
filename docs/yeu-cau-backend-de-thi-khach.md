# Yêu cầu backend: hiển thị toàn bộ đề cho khách

## 1. Bối cảnh

Ở trang **Luyện đề** (`/luyen-de`) và **Thi thử** (`/thi-thu`), chế độ khách hiện chỉ thấy các đề được cho trải nghiệm.

Mục tiêu sản phẩm:

- Khách thấy **tất cả đề đã xuất bản** (để thấy kho đề phong phú của ICE English).
- Khách chỉ **được làm** các đề được cho trải nghiệm.
- Với đề còn lại, khách bấm vào sẽ thấy popup mời đăng ký tư vấn để trở thành học viên.

Video bài giảng, từ vựng và thư viện đọc hiểu đã hoạt động theo cách này: danh sách trả đủ, mỗi mục có cờ `accessible`.

## 2. Hiện trạng

Gọi thử khi chưa đăng nhập:

| Request | Kết quả |
| --- | --- |
| `GET /api/v1/guest/exams?mode=GENERAL_EXAM` | Chỉ trả 1 đề (Đề số 01), **không có** trường `accessible` |
| `GET /api/v1/exams?mode=GENERAL_EXAM` | `401 Unauthorized` |

Frontend không thể tự lấy danh sách đầy đủ cho khách.

## 3. Thay đổi cần làm

### 3.1. `GET /api/v1/guest/exams?mode={GENERAL_EXAM|MOCK}`

Trả **tất cả đề trạng thái đã xuất bản** theo `mode`, kèm cờ `accessible`.

- `accessible: true`: đề được cho khách trải nghiệm.
- `accessible: false`: đề chỉ dành cho học viên.

Ví dụ phản hồi (giữ nguyên dạng mảng như hiện tại):

```json
[
  {
    "id": "1ecd0981-9a4e-41f8-a653-be1f3c8a930e",
    "title": "Đề thi General Exam Tiếng Anh - Đề số 01 (40 câu)",
    "mode": "GENERAL_EXAM",
    "durationMinutes": null,
    "totalQuestions": 40,
    "accessible": true
  },
  {
    "id": "7c1f...",
    "title": "Đề thi General Exam Tiếng Anh - Đề số 02 (40 câu)",
    "mode": "GENERAL_EXAM",
    "durationMinutes": null,
    "totalQuestions": 40,
    "accessible": false
  }
]
```

Lưu ý:

- Chỉ trả thông tin hiển thị (`id`, `title`, `mode`, `durationMinutes`, `totalQuestions`, `accessible`). **Không** trả nội dung câu hỏi, đáp án hay file đề.
- Không trả đề nháp hoặc đề đã lưu trữ.
- Endpoint vẫn công khai, không cần token.
- Sắp xếp giống danh sách học viên (`createdAt` giảm dần) để thứ tự nhất quán.
- Frontend đang tự phân trang và tìm kiếm phía client với danh sách này (12 đề/trang), nên chưa cần phân trang phía server. Nếu số đề lên tới hàng trăm thì cần thảo luận lại.

### 3.2. Chặn làm đề khóa ở phía server (bắt buộc)

Các endpoint làm bài của khách phải từ chối đề có `accessible = false`:

- `POST /api/v1/guest/exams/{id}/start`
- `GET /api/v1/guest/exams/{id}`
- `PUT /api/v1/guest/exams/{id}/parts/{partId}/time`
- `GET /api/v1/guest/exams/{id}/part-logs`
- `POST /api/v1/guest/exams/{id}/submit`
- `GET /api/v1/guest/exams/{id}/answer-url`

Trả `403 Forbidden` kèm `message` rõ ràng, ví dụ: `"Đề này dành cho học viên ICE English."`.

Nếu không chặn ở server, khách vẫn làm được đề khóa bằng cách gõ URL hoặc gọi API trực tiếp. Việc khóa ở giao diện chỉ để trải nghiệm tốt hơn, không phải bảo mật.

### 3.3. Quản trị: bật hoặc tắt cho khách trải nghiệm

Nếu chưa có, cần cách để admin chọn đề nào cho khách trải nghiệm, giống `PUT /api/v1/admin/reading-blogs/{id}/guest-access` với body `{ "guestAccessible": true }`.

Gợi ý: `PUT /api/v1/admin/exams/{id}/guest-access` với cùng dạng body, lưu cột `guest_accessible` (boolean, mặc định `false`) trong bảng đề thi. Nếu hiện đã có cơ chế chọn đề trải nghiệm thì giữ nguyên, chỉ cần ánh xạ ra trường `accessible`.

## 4. Tiêu chí nghiệm thu

1. Khi chưa đăng nhập, `GET /api/v1/guest/exams?mode=GENERAL_EXAM` trả toàn bộ đề đã xuất bản, đề trải nghiệm có `accessible: true`, các đề khác `accessible: false`. `mode=MOCK` cũng tương tự.
2. Khi chưa đăng nhập, gọi `POST /api/v1/guest/exams/{id}/start` với đề `accessible: false` trả `403`. Với đề `accessible: true` thì chạy bình thường như hiện tại.
3. Response danh sách không chứa nội dung câu hỏi hay đáp án.
4. Đề nháp hoặc đã lưu trữ không xuất hiện trong danh sách khách.
5. Luồng của học viên đã đăng nhập (`/api/v1/exams`) không thay đổi.

## 5. Phía frontend (đã làm sẵn)

- Đề có `accessible === false` hiển thị nút **"Đăng ký để làm đề"** (Luyện đề) hoặc **"Đăng ký để vào thi"** (Thi thử). Bấm vào sẽ mở popup mời đăng ký tư vấn.
- Đề có `accessible: true` hoặc không có trường này vẫn vào làm bình thường (tương thích ngược).
- Nên triển khai song song để kiểm thử: sau khi backend deploy, danh sách đề khóa sẽ tự xuất hiện mà không cần sửa thêm frontend.
