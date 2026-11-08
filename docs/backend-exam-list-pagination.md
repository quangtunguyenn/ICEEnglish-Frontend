# Backend: phân trang danh sách đề cho trang Luyện đề và Thi thử

Áp dụng cho hai màn hình của học sinh:
- Trang **Luyện đề** (`GENERAL_EXAM`)
- Trang **Thi thử** (`MOCK`)

## 1. "Lọc PUBLISHED" nghĩa là gì?

Mỗi đề có một trạng thái (`status`):

| Trạng thái | Ý nghĩa | Học sinh có được thấy không? |
|---|---|---|
| `DRAFT` | Đề mới import, giáo viên chưa duyệt xong | **Không** |
| `PUBLISHED` | Đề đã công bố | **Có** |
| `ARCHIVED` | Đề đã gỡ, không dùng nữa | **Không** |

Hiện tại backend trả **tất cả** đề (cả DRAFT, ARCHIVED) cho học sinh, rồi frontend tự giấu đề không phải `PUBLISHED`. Có hai vấn đề:

1. **Phân trang bị sai.** Nếu backend trả 20 đề/trang mà 8 đề là DRAFT, frontend giấu đi thì học sinh chỉ thấy 12 đề, trang thì thiếu, tổng số trang cũng sai.
2. **Lộ dữ liệu.** Đề DRAFT vẫn nằm trong response, học sinh mở tab Network là thấy tên đề chưa công bố.

→ Backend phải **tự lọc**: khi người gọi là học sinh, chỉ trả đề `PUBLISHED`, và lọc **trước** khi phân trang. Frontend sẽ bỏ phần lọc của mình.

## 2. API cần sửa

```http
GET /api/v1/exams?mode=GENERAL_EXAM&page=0&size=12&keyword=&sort=createdAt,desc
GET /api/v1/exams?mode=MOCK&page=0&size=12&keyword=&sort=createdAt,desc
```

| Query | Mặc định | Ghi chú |
|---|---|---|
| `mode` | — | `GENERAL_EXAM` hoặc `MOCK` |
| `page` | `0` | Đánh số từ 0 |
| `size` | `12` | Từ 1 đến 100 |
| `keyword` | rỗng | Tìm theo tiêu đề, không phân biệt hoa thường |
| `sort` | `createdAt,desc` | Đề mới nhất trước |

Quy tắc:
- Người gọi là **học sinh**: luôn chỉ trả `status = PUBLISHED`, bỏ qua mọi tham số `status` mà client gửi.
- Người gọi là **ADMIN/TEACHER**: có thể gửi thêm `status` (`PUBLISHED`, `DRAFT`, `ARCHIVED`); không gửi thì trả tất cả. Trang admin hiện đang gọi API này cho cả 3 mode, nên cần giữ khả năng này.
- Lọc theo `mode`, `status`, `keyword` xong rồi mới phân trang.
- Tương thích ngược: nếu không có `page`/`size` thì giữ response mảng cũ trong thời gian chuyển tiếp.

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Đề thi thử Tốt nghiệp THPT",
      "mode": "MOCK",
      "status": "PUBLISHED",
      "durationMinutes": 50,
      "totalQuestions": 40,
      "createdAt": "2026-11-01T08:00:00+07:00",
      "attempted": true,
      "latestScore": 7.5
    }
  ],
  "page": 0,
  "size": 12,
  "totalElements": 35,
  "totalPages": 3
}
```

## 3. Bỏ các request lẻ cho từng đề (nên làm cùng lúc)

Hiện trang Luyện đề gọi `GET /submissions/practice/{examId}/latest-score` **cho từng đề** (N đề = N request), và trang Thi thử gọi riêng `GET /submissions/mock/scores`. Nếu mỗi item đã có sẵn:

- `attempted` (boolean): học sinh này đã làm chưa
- `latestScore` (số hoặc `null`): điểm lần làm gần nhất

thì frontend không cần gọi thêm, trang tải nhanh hơn và phân trang đơn giản hơn. Hai field này tính theo học sinh đang đăng nhập; với admin có thể là `null`.

Nếu chưa làm được, frontend vẫn gọi riêng như cũ và chỉ cho các đề của **trang hiện tại**.

## 4. Điểm thi thử của học sinh

```http
GET /api/v1/submissions/mock/scores?page=0&size=20&sort=submittedAt,desc
```

Response cùng dạng phân trang như trên. Item: `submissionId`, `examId`, `examTitle`, `score`, `correctCount`, `totalQuestions`, `startedAt`, `submittedAt` (ISO có `+07:00`). Nếu đã có `attempted`/`latestScore` ở mục 3 thì API này chỉ phục vụ màn hình lịch sử.

## 5. Phía frontend sẽ làm khi backend xong

- `getGeneralExams(page, size, keyword)` và `getMockExams(page, size, keyword)` trả về `{ items, page, totalPages, totalElements }`.
- Hai trang hiển thị ô tìm kiếm và nút Trước/Sau (hoặc số trang).
- Bỏ `isPublishedExam` và bước lọc `mode` ở frontend.
- Bỏ gọi `latest-score` từng đề nếu có `latestScore` trong item.

## 6. Cần backend xác nhận

- Có thể trả `attempted`/`latestScore` trong danh sách không, hay giữ API riêng?
- `size` vượt 100 thì báo `400` hay ép về 100?
- Khi nào bật lọc `PUBLISHED` bắt buộc cho học sinh, để frontend bỏ phần lọc cùng lúc?
