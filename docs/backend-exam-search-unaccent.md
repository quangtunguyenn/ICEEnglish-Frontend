# Backend: tìm kiếm đề không phân biệt dấu

Áp dụng cho `GET /api/v1/exams?keyword=` (trang Luyện đề và Thi thử của học sinh).

## Hành vi frontend

- Frontend tự gửi request sau khi học sinh ngừng gõ 300ms, không còn nút "Tìm".
- Frontend gửi nguyên chuỗi học sinh gõ (có dấu hoặc không dấu), đã `trim`. Không gửi `keyword` khi chuỗi rỗng.

## Yêu cầu backend

Khớp theo tên đề **không phân biệt hoa thường và không phân biệt dấu tiếng Việt**:

| Học sinh gõ | Phải tìm ra |
|---|---|
| `de thi thu` | "Đề thi thử Tốt nghiệp THPT" |
| `tot nghiep` | "Đề thi thử Tốt nghiệp THPT" |
| `DE SO 3` | "Đề số 3 - Thầy Thiện" |
| `đề` | cả "Đề ..." lẫn "de ..." |

Lưu ý riêng cho tiếng Việt: `đ`/`Đ` không phải ký tự có dấu theo Unicode NFD, nên phải đổi riêng `đ` → `d` ngoài bước bỏ dấu.

## Cách làm không cần đổi DB

Vì số đề ít (vài chục đến vài trăm), backend có thể chuẩn hóa trong Java:

1. Hàm chuẩn hóa: `Normalizer.normalize(s, NFD)` → bỏ `\p{M}` → thay `đ`→`d`, `Đ`→`D` → `toLowerCase(Locale.ROOT)` → gộp khoảng trắng.
2. Lấy các đề đã lọc `mode` + `status = PUBLISHED` (chưa phân trang), lọc bằng `normalize(title).contains(normalize(keyword))`, sắp xếp, rồi **phân trang trên danh sách đã lọc**. Phải tính `totalElements` và `totalPages` sau khi lọc.
3. Có thể cache danh sách đề đã chuẩn hóa vài chục giây để tìm nhanh hơn.

Cách khác (cần đổi DB, chỉ làm khi team đồng ý): cột `title_search` lưu tên đã chuẩn hóa, hoặc extension `unaccent` của PostgreSQL.

## Lỗi hiện tại cần sửa cùng lúc

Khi không có `keyword`, truy vấn đang báo `function lower(bytea) does not exist`, vì tham số `null` không rõ kiểu. Nếu chuyển sang cách lọc trong Java ở trên thì lỗi này tự hết; nếu giữ truy vấn SQL thì phải ép kiểu `cast(? as text)` hoặc chỉ thêm điều kiện `like` khi có `keyword`.
