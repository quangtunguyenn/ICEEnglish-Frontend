# Backend: API cần sửa / thêm phân trang

Tài liệu này liệt kê các API danh sách frontend đang gọi mà **chưa phân trang** (hoặc cần thêm field) và đề xuất cách sửa. Mục tiêu: không trả toàn bộ dữ liệu một lần khi số lượng đề, video, học sinh tăng.

## Quy ước phân trang chung

Query: `page` (từ 0, mặc định 0), `size` (mặc định 20, tối đa 100), `sort` (tùy chọn), `keyword` (tùy chọn, tìm không phân biệt hoa/thường).

Response thống nhất (đã dùng ở `/admin/mock-exams` và practice history):

```json
{
  "items": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0
}
```

Yêu cầu chung:
- Tương thích ngược: nếu client **không** truyền `page`/`size` thì giữ hành vi cũ trong thời gian chuyển tiếp, sau đó frontend sẽ luôn truyền.
- `size` vượt 100: trả `400` hoặc ép về 100 (nêu rõ trong doc).
- Lọc và sắp xếp phải thực hiện **trước** khi phân trang (không lọc ở frontend sau khi cắt trang).
- Danh sách rỗng trả `items: []`, không phải lỗi.

---

## A. Cần phân trang

| # | API hiện tại | Dùng ở | Vấn đề | Đề xuất |
|---|---|---|---|---|
| 1 | `GET /api/v1/exams?mode=` | Danh sách đề học sinh (`GENERAL_EXAM`, `MOCK`) và trang admin (gọi cả 3 mode) | Trả toàn bộ đề; frontend tự lọc `PUBLISHED` và `mode` | Phân trang + lọc phía server (xem A1) |
| 2 | `GET /api/v1/submissions/mock/scores` | Lịch sử điểm thi thử của học sinh | Trả toàn bộ điểm | Phân trang, mới nhất trước (A2) |
| 3 | `GET /api/v1/videos/titles` | Chọn video theo tên | Cố định khoảng 23 video | **Không cần phân trang** (xem A3) |
| 4 | `GET /api/v1/submissions/{submissionId}/part-logs` | Trang kết quả | Số part ít (≤ ~10) | **Không cần phân trang** |
| 5 | `GET /api/v1/submissions/practice/{examId}/history` | Lịch sử luyện đề | Đã có `page`, `size` | Giữ nguyên; xác nhận trả đủ `totalElements`, `totalPages` |

### A1. `GET /api/v1/exams`

Query: `mode` (`GENERAL_EXAM` | `MOCK` | `HOMEWORK`), `status` (`PUBLISHED` | `DRAFT` | `ARCHIVED`), `keyword`, `page`, `size`, `sort`.

- **Học sinh** (role STUDENT): server **chỉ trả `PUBLISHED`**, bỏ qua `status` do client gửi. Hiện frontend đang tự lọc `PUBLISHED` ở phía client (`isPublishedExam`), tức là đề DRAFT/ARCHIVED vẫn bị trả về học sinh. Cần chặn ở server.
- **ADMIN/TEACHER:** được lọc theo `status` bất kỳ; mặc định trả tất cả trạng thái.
- Sắp xếp mặc định: `createdAt` giảm dần.
- Mỗi item cần đủ field để vẽ thẻ đề mà không phải gọi thêm API: `id`, `title`, `examType`/`mode`, `status`, `durationMinutes`, `totalQuestions`, `shuffleParts`, `createdAt`.
- Với học sinh nên có thêm `attempted` (đã làm chưa) và `latestScore` (nếu có) để tránh gọi `latest-score` cho từng đề (N+1 request).

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "string",
      "mode": "MOCK",
      "status": "PUBLISHED",
      "durationMinutes": 50,
      "totalQuestions": 40,
      "shuffleParts": true,
      "createdAt": "2026-11-01T08:00:00+07:00"
    }
  ],
  "page": 0, "size": 20, "totalElements": 1, "totalPages": 1
}
```

### A2. `GET /api/v1/submissions/mock/scores`

Query: `page`, `size`, `sort` (mặc định `submittedAt,desc`).

Item cần: `submissionId`, `examId`, `examTitle`, `score`, `correctCount`, `totalQuestions`, `startedAt`, `submittedAt` (ISO có offset `+07:00`).

### A3. `GET /api/v1/videos/titles`

Không phân trang vì số video cố định (khoảng 23). Chỉ đề xuất trả thêm `id` cùng `title` cho mỗi item, để frontend không phải gọi tiếp `GET /videos?title=` (tra theo tên dễ trùng).

---

## B. Cần sửa / bổ sung (không phải phân trang)

| # | API | Vấn đề | Đề xuất |
|---|---|---|---|
| B1 | `POST /submissions/submit`, `PUT /submissions/{id}/parts/{partId}/time` | Lỗi `IllegalStateException` (hết hạn, đã nộp, sai mode) trả `5xx` | Map sang `409 Conflict` (đã nộp / hết hạn / sai mode) kèm `code` máy đọc được, ví dụ `ATTEMPT_EXPIRED`, `ALREADY_SUBMITTED`, `WRONG_MODE`. Frontend sẽ hiển thị đúng thông báo và không retry vô ích |
| B2 | `GET /api/v1/exams/{id}/preview` | Chưa có `translate` ở một số bản; không có tên video ôn tập | Luôn trả `translate`; thêm `relatedVideoTitle` bên cạnh `relatedVideoId` |
| B3 | `POST /api/v1/exams/{id}/publish` | Không lưu thời điểm publish; `publishedAt` hiện lấy từ `createdAt` | Thêm cột `published_at`, gán khi publish; backfill bằng `created_at` cho đề đã publish. Cần migration, **chỉ làm khi team đồng ý đổi DB** |
| B4 | `PATCH /api/v1/exams/{id}` (mới) | Không có cách bật/tắt `shuffle_parts` sau khi import | Thêm API cập nhật `shuffleParts`, `durationMinutes`, `title` cho đề DRAFT |
| B5 | `GET /api/v1/admin/mock-exams/{examId}/submissions` (mới) | Chưa có, nên không xem được danh sách học sinh theo vùng điểm | Thêm theo mục 5 trong `backend-mock-stats-spec.md`: `page`, `size`, `scoreMin`, `scoreMax`, `sort=score,desc`. Item gồm `userId`, `fullName`, `submissionId`, `score`, `correctCount`, `durationSeconds`, `submittedAt` |
| B6 | `GET /admin/mock-exams/{examId}/stats/top` | Không có `email` do schema chưa lưu | Chỉ thêm nếu schema có; hiện frontend dùng `fullName` |
| B7 | `GET /api/v1/auth/students` (mới) | Admin tạo học sinh được nhưng không xem/tìm/khóa được | Danh sách học sinh có phân trang: `keyword`, `page`, `size`; item: `id`, `username`, `fullName`, `createdAt`, `active` |

---

## C. Thứ tự ưu tiên đề xuất

1. **B1** (mã lỗi 409) và **A1** (lọc `PUBLISHED` ở server + phân trang) — ảnh hưởng đúng/sai và bảo mật.
2. **A2**, **B5** — phân trang và thống kê.
3. **B2**, **B4**, **B7** — tiện ích cho admin.
4. **B3**, **B6** — cần thay đổi schema, làm khi có kế hoạch migration.

## D. Frontend sẽ làm khi backend sẵn sàng

- Đổi `getGeneralExams`, `getMockExams`, `getAdminExams`, `getMockScores` sang gọi có `page`/`size` và hiển thị nút "Trước/Sau".
- Bỏ lọc `PUBLISHED` ở client sau khi server đảm bảo.
- Hiển thị thông báo theo mã lỗi `409`.
