# Hướng dẫn import đề GENERAL_EXAM (luyện đề)

File mẫu: [exam-import-general-exam.json](./exam-import-general-exam.json)

## 1. Cách import

1. Đăng nhập tài khoản `ADMIN` hoặc `TEACHER`, vào trang **Admin → Quản lý đề thi**.
2. Chọn loại đề **GENERAL_EXAM** trong ô chọn bên trái.
3. Chọn file `.json`, bấm **Import đề**. Đề được tạo ở trạng thái `DRAFT`.
4. Chọn đề vừa tạo, bấm **Preview** để kiểm tra, rồi **Publish** để học sinh làm được.

API tương ứng: `POST /api/v1/exams/import?examType=GENERAL_EXAM` (`multipart/form-data`, field `file`).

## 2. Cấu trúc file

```
{ "exam": {...}, "parts": [ { ...part, "questions": [ {...question} ] } ] }
```

### `exam`

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| `title` | có | Tên đề |
| `exam_type` | có | `GENERAL_EXAM` |
| `duration_minutes` | không | Không bắt buộc với GENERAL_EXAM (không có bộ đếm giờ thi) |
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

- Đặt `"shuffle_parts": true` ở `exam`. Mỗi lượt làm (mỗi lần bấm bắt đầu), backend xáo thứ tự part ngẫu nhiên và **lưu cố định cho lượt đó**. Hai lượt có thể tình cờ trùng thứ tự.
- Chỉ trộn **part**, thứ tự câu trong mỗi part giữ nguyên.
- Số câu hiển thị luôn chạy **1 → N theo thứ tự màn hình** (backend trả `displayNumber`). Frontend tự đổi các số viết cứng trong **cùng part** cho khớp: `Question 13.` đầu `content`, ô trống `(13)`, `(Questions 13-17)` trong `part_name`/`passage_text`/`content`/`explanation`, và placeholder `{{q:13}}`.
- Hãy **viết số gốc** trong JSON (đúng `order_index`), không viết số theo vị trí mới. Chỉ các số trùng với `order_index` của câu thuộc part đó mới bị đổi; `opt_a`–`opt_d` không bị đổi.
- Muốn giữ một part đứng yên: `"fixed_position": true`.
- Muốn chỉ trộn trong từng nhóm dạng bài: gán cùng `shuffle_group` (ví dụ `"A"`, `"B"`).
- Hiện **chưa có API bật/tắt shuffle sau import**; cần import lại nếu muốn đổi.
- Chỉ bật shuffle khi các part độc lập nhau. Backend và frontend không sửa số câu hay số ô trống viết cứng trong nội dung.

## 5. Lưu ý riêng cho GENERAL_EXAM

- Học sinh có thể làm nhiều lượt; mỗi lượt bắt đầu mới có thể ra thứ tự part khác. Lượt đang làm dở được tiếp tục với đúng thứ tự cũ.
- Bản nháp đáp án lưu trên máy theo từng lượt làm.
- Trang kết quả hiển thị đáp án đúng và lời giải **chỉ khi đề đã được công bố đáp án** (`Công bố đáp án` ở trang quản lý).
- Đề `HOMEWORK` (bài tập video) không có part để trộn, không dùng file này.

## 6. Kiểm tra nhanh trước khi import

- [ ] File là JSON hợp lệ (không dư dấu phẩy, dấu ngoặc kép trong chuỗi phải viết `\"`).
- [ ] `order_index` của part và của câu liên tục, không trùng.
- [ ] Mỗi câu có đủ `opt_a`–`opt_d` và `correct_opt` hợp lệ.
- [ ] Preview kiểm tra định dạng, rồi mới Publish.
