# Yêu cầu backend: thứ tự hiển thị video (`position`)

## 1. Mục tiêu

Admin tự sắp xếp thứ tự video bài giảng theo chương và bài: `1`, `1.1`, `1.2`, … `1.10`, `2`, `2.1`, … Thứ tự này áp dụng cho học sinh và khách, không chỉ riêng admin.

## 2. Dữ liệu

Thêm cột `videos.position` (chuỗi, cho phép `null`).

- Định dạng hợp lệ: `^\d+(\.\d+)?$`, ví dụ `"1"`, `"1.1"`, `"2.10"`. Không dùng số thực vì `1.10` và `1.1` là cùng một số.
- Không cho hai video trùng `position` (unique, bỏ qua `null`).
- Video cũ để `null`. Video tạo từ learning bundle **không cần** field này, mặc định `null`.
- Nên lưu thêm hai cột số nguyên suy ra từ chuỗi (`position_chapter`, `position_lesson`; `lesson = 0` nếu chỉ có chương) để sắp xếp bằng SQL.

## 3. Quy tắc sắp xếp

So sánh từng phần như số nguyên, không so sánh chuỗi: `1 < 1.1 < 1.2 < … < 1.9 < 1.10 < 2 < 2.1`.

Video `position = null` xếp sau tất cả video có số, theo `createdAt` tăng dần (hoặc theo title; chọn một cách và giữ ổn định).

## 4. API sửa position (admin)

```http
PUT /api/v1/admin/videos/{videoId}/position
Authorization: Bearer <admin-token>
Content-Type: application/json
```

```json
{ "position": "2.3" }
```

Gửi `null` hoặc chuỗi rỗng để bỏ số. Trả `204 No Content`.

Lỗi:

- `400`: sai định dạng, message dạng `Vị trí không hợp lệ. Ví dụ: 1, 1.1, 2.10.`
- `404`: không có video.
- `409`: trùng position, message dạng `Vị trí 2.3 đã được dùng cho video khác.` kèm tên video đang giữ (nếu có thể).

Ghi chú: cho phép admin **và** teacher nếu đang được phép nạp bundle; nếu chỉ admin thì ghi rõ.

## 5. Thay đổi response hiện có

Thêm `position` (chuỗi hoặc `null`) vào từng item và **trả danh sách đã sắp theo quy tắc mục 3**:

```http
GET /api/v1/videos/titles
GET /api/v1/guest/videos
```

```json
[
  { "video_id": "uuid-1", "title": "CHUYÊN ĐỀ 1", "position": "1" },
  { "video_id": "uuid-2", "title": "Bài 1", "position": "1.1" }
]
```

```json
[
  { "videoId": "uuid-1", "title": "CHUYÊN ĐỀ 1", "position": "1", "accessible": true }
]
```

Nếu các API video khác đang trả danh sách (ví dụ `GET /api/v1/videos?title=`), thêm `position` tương tự để nhất quán.

## 6. Frontend sẽ làm khi có API

- Mục "Danh sách video" của admin thêm ô nhập `position` cho từng video.
- Trang video bài giảng và trang luyện tập từ vựng bỏ bước tự sắp theo tên, dùng đúng thứ tự backend trả về và hiện số trước tiêu đề (ví dụ `2.3 · Tên bài`).
