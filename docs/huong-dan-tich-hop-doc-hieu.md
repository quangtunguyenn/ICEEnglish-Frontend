# Tích hợp thư viện đọc hiểu

## Triển khai

Frontend dùng route `/doc-hieu`, `/doc-hieu/:blogId` và `/doc-hieu/:blogId/tu-vung`; quản lý bài đọc nằm trong trang quản trị và chỉ hiển thị với ADMIN. Khách dùng API `/api/v1/guest/reading-blogs`, học sinh dùng `/api/v1/reading-blogs`, admin dùng `/api/v1/admin/reading-blogs`.

Trước khi sử dụng, triển khai backend và áp dụng migration `V6__Create_reading_library.sql` theo quy trình PostgreSQL của backend. Backend không tự chạy Flyway theo hướng dẫn tích hợp; không chạy SQL production ngoài quy trình triển khai/backup. Admin cần import và publish ít nhất một bài. Migration tạo bảng và index `reading_*`, không sửa bảng cũ.

## Hành vi

- Khách thấy metadata bài published, bấm bài khóa sẽ đến đăng nhập; backend vẫn phải kiểm tra quyền ở mọi request. Học sinh được mở mọi bài published.
- Nội dung và bản dịch được render dưới dạng văn bản thuần. Người đọc có thể bật bản dịch theo từng đoạn.
- Mỗi lựa chọn gửi `revision` và `selectedOption` đến API trả lời của câu hỏi, hiển thị phản hồi ngay và có thể thử lại. Thống kê đúng/tổng câu dựa trên **lựa chọn gần nhất** trong lần xem hiện tại, không lưu server. Không có API nộp cả bài.
- Nếu nhận `409` khi trả lời, tải lại bài để lấy revision mới; các lựa chọn tạm bị xóa.
- Route từ vựng gọi API từ vựng bài đọc riêng khi tải trang và không thêm bài đọc vào danh sách video. Thẻ lật hiển thị từ, phiên âm, nghĩa và ví dụ nếu có.
- Admin upload JSON field `file`, preview bản nháp, publish/archive và đổi quyền khách. Import tạo bài mới; không có chức năng sửa hoặc xóa vật lý.

Hợp đồng JSON import dùng `snake_case`; response API dùng `camelCase` và không có lớp `data`. Kiểm tra schema, giới hạn import, quyền và rate limiting theo hướng dẫn backend; đặc biệt chỉ import nội dung có quyền đăng tải.
