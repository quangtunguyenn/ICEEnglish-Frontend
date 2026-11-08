# Yêu cầu Backend: Thống kê đề thi thử (MOCK) cho Admin

Tất cả API dưới đây chỉ dành cho ADMIN/STAFF (401/403 nếu không đủ quyền). Response dùng camelCase, bọc trong cùng format response hiện tại của hệ thống.

Quy ước chung:
- Chỉ tính các bài đã **nộp** (`SUBMITTED`/đã chấm), loại bỏ bài đang làm dở (`IN_PROGRESS`).
- Điểm theo **thang 10**, làm tròn 2 chữ số thập phân.
- Nếu một học sinh có nhiều lượt làm (MOCK hiện chỉ 1 lượt) thì chỉ tính lượt nộp đầu tiên/điểm cao nhất — vui lòng ghi rõ lựa chọn trong response doc.

---

## 1. Danh sách đề MOCK đang publish

`GET /api/v1/admin/mock-exams?page=0&size=20&keyword=`

- Lọc `examType = MOCK` và `status = PUBLISHED`.
- Sắp xếp mặc định: `publishedAt` giảm dần.

```json
{
  "items": [
    {
      "examId": "uuid",
      "title": "Đề thi thử Tốt nghiệp THPT ...",
      "durationMinutes": 50,
      "totalQuestions": 40,
      "publishedAt": "2026-11-01T08:00:00Z",
      "submittedCount": 120,
      "averageScore": 6.85
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 5,
  "totalPages": 1
}
```

---

## 2. Tổng quan thống kê của 1 đề

`GET /api/v1/admin/mock-exams/{examId}/stats/overview`

```json
{
  "examId": "uuid",
  "title": "string",
  "totalQuestions": 40,
  "submittedCount": 120,
  "averageScore": 6.85,
  "highestScore": 9.75,
  "lowestScore": 2.5,
  "medianScore": 7.0,
  "averageDurationSeconds": 2700,
  "scoreDistribution": [
    { "label": "0-3", "min": 0, "max": 3, "count": 4, "percent": 3.33 },
    { "label": "3-4", "min": 3, "max": 4, "count": 8, "percent": 6.67 }
  ]
}
```

Quy tắc phân vùng điểm (backend định nghĩa và trả sẵn `label`, frontend chỉ vẽ):
- Các khoảng mặc định: `0-3`, `3-4`, `4-5`, `5-6`, `6-7`, `7-8`, `8-9`, `9-10`, `10`.
- Quy ước biên **nửa mở `[min, max)`**, riêng điểm `10` tách thành vùng riêng (`min = 10, max = 10`).
- Nếu muốn các mốc khác (ví dụ `8`, `9` đứng riêng như ví dụ `8-9, 9, 9-10, 10`), cho phép query `?buckets=0,3,4,5,6,7,8,9,10` và backend tự sinh nhãn; bucket cuối cùng `10` là điểm tuyệt đối.
- Luôn trả đủ các vùng, kể cả `count = 0`, theo thứ tự tăng dần.

---

## 3. Thống kê từng câu hỏi

`GET /api/v1/admin/mock-exams/{examId}/stats/questions`

Sắp xếp theo thứ tự gốc của đề (`partOrderIndex`, `questionOrderIndex`). Số câu `questionNumber` là **số thứ tự gốc** (1..N), không phụ thuộc thứ tự trộn của từng học sinh.

```json
{
  "examId": "uuid",
  "submittedCount": 120,
  "questions": [
    {
      "questionId": "uuid",
      "partId": "uuid",
      "partName": "Part 3: ...",
      "questionNumber": 39,
      "content": "string",
      "correctOpt": "B",
      "answeredCount": 118,
      "unansweredCount": 2,
      "correctCount": 94,
      "wrongCount": 24,
      "correctPercent": 79.66,
      "wrongPercent": 20.34,
      "optionStats": [
        { "option": "A", "count": 71, "percent": 60.17, "correct": false },
        { "option": "B", "count": 12, "percent": 10.17, "correct": true },
        { "option": "C", "count": 12, "percent": 10.17, "correct": false },
        { "option": "D", "count": 23, "percent": 19.49, "correct": false }
      ]
    }
  ]
}
```

Quy tắc:
- `percent` tính trên `answeredCount` (không tính câu bỏ trống). Câu bỏ trống trả riêng ở `unansweredCount`; nếu muốn tính trên tổng bài nộp thì ghi rõ trong doc. Đề xuất: `correctPercent + wrongPercent = 100` trên `answeredCount`.
- `optionStats` luôn đủ A, B, C, D.
- Optional: `?sort=correctPercent&order=asc` để admin xem ngay các câu khó nhất.

---

## 4. Top học sinh điểm cao nhất

`GET /api/v1/admin/mock-exams/{examId}/stats/top?limit=5`

- `limit` mặc định 10, tối đa 100.
- Sắp xếp: `score` giảm dần → nếu trùng điểm thì `submittedAt` **tăng dần** (nộp sớm hơn xếp trên) → nếu vẫn trùng thì `durationSeconds` tăng dần → `submissionId` để ổn định.
- Trả `rank` liên tục 1..limit (không chia hạng đồng điểm).

```json
{
  "examId": "uuid",
  "limit": 5,
  "items": [
    {
      "rank": 1,
      "userId": "uuid",
      "fullName": "Nguyễn Văn A",
      "email": "a@example.com",
      "submissionId": "uuid",
      "score": 9.75,
      "correctCount": 39,
      "totalQuestions": 40,
      "durationSeconds": 2410,
      "submittedAt": "2026-11-05T09:12:33Z"
    }
  ]
}
```

---

## 5. (Tuỳ chọn) Danh sách bài nộp có phân trang

`GET /api/v1/admin/mock-exams/{examId}/submissions?page=0&size=20&sort=score,desc&scoreMin=&scoreMax=`

Dùng để admin bấm vào 1 vùng điểm (ví dụ 8-9) và xem danh sách học sinh thuộc vùng đó. Mỗi item giống item của API top (không có `rank`).

---

## Ghi chú kỹ thuật

- Có thể gộp (2) + (3) vào một API nếu muốn ít request hơn, nhưng đề xuất tách riêng để tải tổng quan nhanh và tải bảng câu hỏi sau.
- Cần index theo `(exam_id, status)` và `(submission_id, question_id)`; nếu dữ liệu lớn nên tính bằng query `GROUP BY` thay vì load toàn bộ vào bộ nhớ.
- Đề chưa có bài nộp: trả `submittedCount = 0`, các số liệu trung bình/cao/thấp là `null`, danh sách rỗng, **không** trả lỗi.
- `examId` không tồn tại hoặc không phải MOCK: `404`.
- Điểm mỗi bài lưu ở thang 10; nếu backend lưu theo số câu đúng thì quy đổi `correctCount / totalQuestions * 10`.
