# Yêu cầu backend: so sánh thời gian làm từng Part

## 1. Mục tiêu

Trên trang kết quả luyện đề và thi thử, học sinh thấy thời gian đã làm,
thời gian gợi ý và chênh lệch của từng Part. Ví dụ: **4 phút 40 giây / gợi ý
4 phút — lâu hơn 40 giây**.

Nhận xét chỉ mô tả thời gian so với gợi ý, không kết luận làm nhanh là làm
tốt hoặc làm chậm là làm sai.

## 2. Hợp đồng đã được backend xác nhận

- Backend ghi nhận thời gian từ đồng hồ server khi nhận tín hiệu chuyển Part;
  giá trị gợi ý được lưu riêng theo từng lượt làm.
- Log bao gồm thời gian Part đang hoạt động cả khi đóng/ẩn tab hoặc mất kết nối,
  không phải thời gian tập trung. Các tín hiệu gửi thất bại không được tự khôi phục.
- Trang kết quả dùng `partId` và `displayIndex` từ log để sắp xếp cả thẻ
  thời gian và nhóm câu trả lời theo lượt làm; nhãn hiển thị được đánh số
  `Part 1`, `Part 2`, ... theo thứ tự đó và giữ tên nội dung, không đổi tên
  Part ở backend.
  Khi thiếu `displayIndex`, giữ thứ tự mảng log do backend trả về.
- Bài tập về nhà không hỗ trợ ghi nhận thời gian từng Part.
- Backend cần áp dụng migration `V5__Add_server_part_timing_to_submissions.sql`
  và `V16__Add_part_recommendation_snapshots.sql` trước khi triển khai.

## 3. API kết quả thời gian cho học sinh

Ưu tiên bổ sung dữ liệu vào API đang dùng, không cần tạo endpoint mới nếu
API này đã đáp ứng:

```http
GET /api/v1/submissions/{submissionId}/part-logs
Authorization: Bearer <accessToken>
```

Ví dụ response `200 OK`, dạng mảng; nếu API hiện đang dùng lớp bọc, có thể
giữ nguyên cấu trúc bọc hiện tại:

```json
[
  {
    "partId": "part-1",
    "partName": "Part 1",
    "displayIndex": 1,
    "timeSpentSeconds": 280,
    "recommendedTimeSeconds": 240
  },
  {
    "partId": "part-2",
    "partName": "Part 2",
    "displayIndex": 2,
    "timeSpentSeconds": null,
    "recommendedTimeSeconds": null
  }
]
```

| Trường | Yêu cầu |
|---|---|
| `partId` | ID ổn định của Part trong lượt làm, dùng để ghép dữ liệu. |
| `partName` | Tên Part để hiển thị. |
| `displayIndex` | Thứ tự Part trong lượt làm, kể cả khi đề được trộn. |
| `timeSpentSeconds` | Tổng thời gian của lượt làm cho Part, đơn vị giây, số nguyên không âm; `null` nếu không xác định được. |
| `recommendedTimeSeconds` | Thời gian gợi ý cho Part, đơn vị giây, số nguyên dương; `null` nếu chưa thiết lập hoặc không xác định được. Ánh xạ từ `recommended_time_seconds` khi import. |

Yêu cầu bổ sung:

- Trả đúng dữ liệu của `submissionId`; chỉ chủ sở hữu lượt làm hoặc người có
  quyền phù hợp được truy cập. Giữ nguyên cơ chế xác thực và mã lỗi hiện có.
- Với Part có nhiều lần được mở trong cùng lượt, thời gian thực tế phải là
  tổng của các khoảng đã ghi nhận, không chỉ khoảng cuối.
- Phân biệt `0` giây thực sự được ghi nhận với `null` khi không có hoặc không
  xác định được dữ liệu; không tự thay dữ liệu thiếu bằng `0`. Trả các Part
  chưa có log với thời gian `null` nếu backend xác định được chúng.
- Chốt thời gian của Part đang mở khi nộp bài; dữ liệu sau nộp và khi xem
  lại lịch sử phải nhất quán, không tiếp tục tăng.
- Lưu giá trị thời gian gợi ý tương ứng với lượt làm, để sửa đề về sau không
  làm thay đổi phép so sánh của lượt đã nộp. Với lượt cũ không khôi phục được
  giá trị, trả `null`; không tự suy đoán.
- Khi học sinh đóng/ẩn tab hoặc mất kết nối, thời gian vẫn được cộng vào
  Part đang hoạt động trên server. Frontend không suy đoán thời gian tập trung.
- Giữ tương thích với các client đang sử dụng API; không bỏ các trường cũ.

## 4. Khách và homework

- Khách làm luyện đề hoặc thi thử dùng các trường tương đương qua
  `GET /api/v1/guest/exams/{examId}/part-logs`, với
  `X-Guest-Attempt: <submissionId>`, hoặc response nộp bài của khách.
  Backend xác minh lượt thuộc đúng đề; lượt khách chỉ được lưu trong bộ nhớ
  server và không có lịch sử bền vững.
- Nếu mở rộng sang homework, cần thống nhất cách ghi thời gian, quyền truy
  cập và API kết quả cho cả học sinh và khách. Bộ đếm hiện tại trên trình
  duyệt không đủ để đảm bảo dữ liệu lịch sử trên các thiết bị.

## 5. Tiêu chí nghiệm thu

1. Với thời gian gợi ý 240 giây và thời gian thực tế 280 giây, API trả đúng
   hai giá trị cho cùng `partId`; frontend có thể tính chênh lệch 40 giây.
2. Với Part chưa có thời gian gợi ý hoặc không có log đáng tin cậy, API trả
   `null` cho trường tương ứng, không tạo nhận xét so sánh sai.
3. Chuyển Part rồi quay lại: thời gian được cộng dồn; nộp bài xong và xem lại
   cùng lượt vẫn nhận kết quả đã chốt.
4. Đề trộn Part: `displayIndex` và `partId` phản ánh đúng thứ tự, không ghép
   nhầm thời gian giữa các Part.
5. Người dùng không thể xem log của lượt làm không thuộc quyền truy cập.
6. Giá trị gợi ý của lượt đã nộp không thay đổi khi đề được chỉnh sửa; dữ liệu
   lịch sử thiếu giá trị được thể hiện rõ là `null`.

