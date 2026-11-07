# Hướng dẫn import đề MOCK (thi thử)

File mẫu: [exam-import-mock.json](./exam-import-mock.json)

## 1. Cách import

1. Đăng nhập tài khoản `ADMIN` hoặc `TEACHER`, vào trang **Admin → Quản lý đề thi**.
2. Chọn loại đề **MOCK** trong ô chọn bên trái.
3. Chọn file `.json`, bấm **Import đề**. Đề được tạo ở trạng thái `DRAFT`.
4. Chọn đề vừa tạo, bấm **Preview** để kiểm tra, rồi **Publish** để học sinh làm được.

API tương ứng: `POST /api/v1/exams/import?examType=MOCK` (`multipart/form-data`, field `file`).
Loại đề chọn trên giao diện (`examType`) là loại mà backend dùng; để `exam.exam_type` trong file là `MOCK` cho khớp.

## 2. Cấu trúc file

```
{ "exam": {...}, "parts": [ { ...part, "questions": [ {...question} ] } ] }
```

### `exam`

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| `title` | có | Tên đề |
| `exam_type` | có | `MOCK` |
| `duration_minutes` | **có (riêng MOCK)** | Thời gian làm bài (phút), phải > 0. Thiếu thì import bị từ chối |
| `is_answers_revealed` | không | `false` mặc định; có thể bật/tắt sau ở trang quản lý |
| `shuffle_parts` | không | `true` = trộn thứ tự part mỗi lượt làm. Mặc định `false` |

### `parts[]`

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| `part_name` | có | Tên part, ví dụ `Part 1: ... (Questions 1-6)` |
| `part_type` | có | Một trong: `CLOZE_TEST`, `ARRANGEMENT`, `FILLIN_CLOZE`, `READING_8`, `READING_10` |
| `passage_text` | không | Hướng dẫn và bài đọc (xem mục 3) |
| `recommended_time_seconds` | không | Thời gian gợi ý cho part |
| `order_index` | có | Thứ tự gốc của part (1, 2, 3, …) |
| `fixed_position` | không | `true` = part không bị trộn, giữ đúng vị trí gốc. Mặc định `false` |
| `shuffle_group` | không | Tên nhóm trộn; chỉ các part không cố định cùng nhóm đổi chỗ cho nhau. `null` = một nhóm chung. Không được là chuỗi rỗng, tối đa 255 ký tự |

### `questions[]`

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| `order_index` | có | Số câu gốc trong đề (liên tục: 1, 2, 3, …) |
| `content` | có | Nội dung câu hỏi (xem mục 3) |
| `opt_a` … `opt_d` | có | 4 đáp án |
| `correct_opt` | có | `A`, `B`, `C` hoặc `D` |
| `explanation` | không | Lời giải, hỗ trợ `**đậm**`, `*nghiêng*` |
| `related_video_id` | không | ID video ôn tập hoặc `null` |

## 3. Quy ước định dạng văn bản

| Muốn hiển thị | Viết trong JSON |
|---|---|
| Hướng dẫn bài đọc (đậm + nghiêng) | `***Read the following ...***` |
| Tên bài đọc (HOA, đậm, căn giữa) | Một đoạn riêng `# TÊN BÀI`, ngăn cách các đoạn bằng `\n\n` |
| Câu hỏi của part (đậm) | `**Question 1. Choose ...**` |
| Đoạn văn mới / xuống dòng | `\n\n` giữa các đoạn |
| Chữ nghiêng, gạch chân | `*text*`, `<u>text</u>` |

Câu hỏi sắp xếp (ARRANGEMENT): mỗi ý một dòng, ngăn cách bằng `\n\n`:

```
"content": "**Question 3.**\n\na. ...\n\nb. ...\n\nc. ..."
```

Nếu `content` bắt đầu bằng `Question N` hoặc `Câu N`, hệ thống không tự thêm tiền tố nữa.

## 4. Trộn part (shuffle)

- Đặt `"shuffle_parts": true` ở `exam`. Mỗi lượt làm, backend xáo thứ tự part ngẫu nhiên và **lưu cố định cho lượt đó** (tải lại trang vẫn giữ). Hai lượt có thể tình cờ trùng thứ tự.
- Chỉ trộn **part**, thứ tự câu trong mỗi part giữ nguyên.
- Số câu hiển thị luôn chạy **1 → N theo thứ tự màn hình** (backend trả `displayNumber`). Frontend tự đổi các số viết cứng trong **cùng part** cho khớp: `Question 13.` đầu `content`, ô trống `(13)`, `(Questions 13-17)` trong `part_name`/`passage_text`/`content`/`explanation`, và placeholder `{{q:13}}`.
- Hãy **viết số gốc** trong JSON (đúng `order_index`), không viết số theo vị trí mới. Chỉ các số trùng với `order_index` của câu thuộc part đó mới bị đổi; `opt_a`–`opt_d` không bị đổi.
- Muốn giữ một part đứng yên (ví dụ part mở đầu): `"fixed_position": true`.
- Muốn chỉ trộn trong từng nhóm dạng bài: gán cùng `shuffle_group` (ví dụ `"A"`, `"B"`).
- Hiện **chưa có API bật/tắt shuffle sau import**; cần import lại nếu muốn đổi.
- Chỉ bật shuffle khi các part độc lập nhau. Backend và frontend không sửa số câu hay số ô trống viết cứng trong nội dung.

## 5. Lưu ý riêng cho MOCK

- Mỗi học sinh chỉ có **một lượt** thi thử. Lượt đã nộp hoặc hết hạn không bắt đầu lại được.
- Thời gian làm từng part được ghi lại và hiển thị ở trang kết quả (theo thứ tự part của lượt đó).
- Đề dùng `duration_minutes` làm bộ đếm giờ.

## 6. Kiểm tra nhanh trước khi import

- [ ] File là JSON hợp lệ (không dư dấu phẩy, dấu ngoặc kép trong chuỗi phải viết `\"`).
- [ ] Có `duration_minutes` > 0.
- [ ] `order_index` của part và của câu liên tục, không trùng.
- [ ] Mỗi câu có đủ `opt_a`–`opt_d` và `correct_opt` hợp lệ.
- [ ] Preview kiểm tra định dạng, rồi mới Publish.
