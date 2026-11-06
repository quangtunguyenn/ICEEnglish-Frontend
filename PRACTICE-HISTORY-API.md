# Đề xuất API lịch sử làm bài luyện đề

## Mục đích

Tại trang danh sách đề luyện tập, học sinh có thể mở danh sách các lần đã nộp
của từng đề, phân biệt theo thời gian nộp và xem chi tiết một lần làm bài.
Nếu chưa nộp lần nào, nút xem lịch sử không hiển thị.

Các API và trường dữ liệu bên dưới là **đề xuất**, không khẳng định backend
đã triển khai. Chức năng áp dụng cho đề `GENERAL_EXAM`.

## 1. Xác định đề đã có bài nộp

Đề xuất bổ sung `submittedCount` hoặc `hasSubmitted` cho từng đề trong response
của API danh sách đề hiện có:

```http
GET /api/v1/exams?mode=GENERAL_EXAM
Authorization: Bearer <accessToken>
```

Giá trị phải được tính theo học sinh đang đăng nhập và chỉ tính các lượt đã
nộp. Frontend hiển thị nút **Xem danh sách bài đã làm** nếu số lượt lớn hơn 0
hoặc `hasSubmitted` là `true`.

Nếu chưa thể bổ sung trường này, có thể tiếp tục dùng API `latest-score` hiện
tại nếu backend phân biệt rõ trường hợp chưa có bài với lỗi tải dữ liệu.
Lỗi API hoặc mất mạng không được coi là học sinh chưa làm bài.

## 2. Danh sách các lượt đã nộp của một đề

```http
GET /api/v1/submissions/practice/{examId}/history?page=0&size=20
Authorization: Bearer <accessToken>
```

Ví dụ response:

```json
{
  "data": {
    "examId": "exam-123",
    "examTitle": "Đề luyện tập số 1",
    "items": [
      {
        "submissionId": "sub-002",
        "submittedAt": "2026-11-06T14:30:00Z",
        "score": 8.5,
        "totalQuestions": 40,
        "totalCorrect": 34
      },
      {
        "submissionId": "sub-001",
        "submittedAt": "2026-11-05T09:15:00Z",
        "score": 7.5,
        "totalQuestions": 40,
        "totalCorrect": 30
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 2,
    "totalPages": 1
  }
}
```

Yêu cầu:

- Chỉ trả các lượt đã nộp của học sinh đang đăng nhập, thuộc đúng đề.
- Sắp xếp theo thời gian nộp mới nhất trước; hỗ trợ phân trang.
- `submissionId` xác định duy nhất một lượt làm.
- `submittedAt` là thời điểm nộp theo ISO 8601, có múi giờ; ưu tiên UTC.
  Frontend hiển thị giờ, phút, ngày, tháng và năm theo múi giờ Việt Nam.
- Khi chưa có bài, trả danh sách `items` rỗng, không coi là lỗi.
- Backend kiểm tra quyền truy cập; không trả lịch sử của học sinh khác.

## 3. Chi tiết một lượt làm bài

```http
GET /api/v1/submissions/practice/{submissionId}/review
Authorization: Bearer <accessToken>
```

Response nên tương thích với cấu trúc của API `latest-review` hiện tại để tái
sử dụng màn hình kết quả. Ví dụ minh họa:

```json
{
  "data": {
    "submissionId": "sub-002",
    "examId": "exam-123",
    "examTitle": "Đề luyện tập số 1",
    "submittedAt": "2026-11-06T14:30:00Z",
    "score": 8.5,
    "totalQuestions": 2,
    "totalCorrect": 1,
    "totalIncorrect": 1,
    "parts": [
      {
        "partId": "part-1",
        "partName": "Part 1",
        "orderIndex": 1,
        "passageText": "Nội dung bài đọc"
      }
    ],
    "partTranslations": [],
    "details": [
      {
        "questionId": "q-1",
        "partId": "part-1",
        "orderIndex": 1,
        "content": "Nội dung câu hỏi",
        "optA": "Lựa chọn A",
        "optB": "Lựa chọn B",
        "optC": "Lựa chọn C",
        "optD": "Lựa chọn D",
        "selectedOpt": "A",
        "correctOpt": "B",
        "isCorrect": false,
        "relatedVideo": {
          "videoId": "video-1",
          "videoTitle": "Video ôn tập"
        }
      },
      {
        "questionId": "q-2",
        "partId": "part-1",
        "orderIndex": 2,
        "content": "Câu hỏi thứ hai",
        "optA": "Lựa chọn A",
        "optB": "Lựa chọn B",
        "optC": "Lựa chọn C",
        "optD": "Lựa chọn D",
        "selectedOpt": "A",
        "correctOpt": "A",
        "isCorrect": true,
        "relatedVideo": null
      }
    ]
  }
}
```

Yêu cầu:

- Trả đúng lượt theo `submissionId`, không mặc định lấy lượt gần nhất.
- Chỉ cho phép học sinh xem lượt thuộc tài khoản của mình và đã nộp.
- Bao gồm các câu chưa trả lời với `selectedOpt: null`, nội dung Part, bản
  dịch và video ôn tập nếu có.
- Áp dụng chính sách công bố đáp án ở backend. Ví dụ trên minh họa dữ liệu khi
  được phép công bố; không gửi thông tin đáp án bị hạn chế chỉ vì frontend có
  thể ẩn chúng.
- Trả lỗi phù hợp khi không tìm thấy lượt hoặc không có quyền truy cập.

Thời gian từng Part có thể tiếp tục lấy qua API hiện có:

```http
GET /api/v1/submissions/{submissionId}/part-logs
Authorization: Bearer <accessToken>
```

Backend cần kiểm tra quyền sở hữu lượt làm cho API này.

## 4. Tích hợp frontend sau khi có API

- Đổi nút xem bài gần nhất thành **Xem danh sách bài đã làm**; ẩn nút khi xác
  nhận học sinh chưa có lượt nộp.
- Tạo màn hình lịch sử theo đề, hiển thị thời điểm nộp và phân trang; có trạng
  thái tải, trống và lỗi.
- Khi chọn một lượt, tải chi tiết bằng `submissionId` và mở màn hình kết quả.
  Hỗ trợ tải lại trang hoặc mở trực tiếp mà không phụ thuộc dữ liệu trong
  `sessionStorage`.
- Phân biệt lỗi tải danh sách/chi tiết với trường hợp chưa có bài và cho phép
  học sinh thử lại.
