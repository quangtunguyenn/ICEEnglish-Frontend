# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Lịch sử luyện đề

Trang luyện đề hiển thị liên kết lịch sử khi API danh sách đề trả
`hasSubmitted: true` hoặc `submittedCount > 0`. Nếu thiếu cả hai trường,
frontend kiểm tra lịch sử của đề; lỗi kiểm tra được thông báo và có thể thử lại.
Lịch sử được phân trang và hiển thị thời điểm nộp theo giờ Việt Nam. Chi tiết
của từng lượt được tải từ server theo `submissionId`, kể cả khi mở trực tiếp
hoặc tải lại trang. Hợp đồng API được mô tả trong
[PRACTICE-HISTORY-API.md](./PRACTICE-HISTORY-API.md).

## Lưu bài thi thử trên trình duyệt

Học sinh bấm **Lưu** để lưu đáp án và thời gian theo Part trên trình duyệt,
không đồng bộ bản nháp với server. Chỉ bản lưu gần nhất được khôi phục khi
quay lại trên cùng trình duyệt và thiết bị; thay đổi chưa lưu có thể mất,
và xóa dữ liệu trình duyệt hoặc đổi thiết bị sẽ mất khả năng khôi phục.
Không mở cùng lượt thi trong nhiều tab hoặc thiết bị vì không có cơ chế
phối hợp hay giải quyết xung đột giữa các phiên.

Hạn thi được lưu trên máy và tiếp tục trôi qua khi đóng tab. Đồng hồ phụ thuộc
giờ hệ thống, có thể bị thay đổi và không được backend xác thực; không có chức
năng admin điều chỉnh thời gian. Nếu hết giờ khi trang đang mở, frontend thử
nộp đáp án hiện tại. Nếu quay lại sau khi hết giờ, frontend thử nộp bản lưu
gần nhất; nếu chưa từng bấm Lưu thì bản đó không có đáp án. Khi mất mạng hoặc
nộp chưa xác nhận, bản lưu được giữ lại và có thể thử nộp lại sau khi kết nối.
Không có tác vụ backend tự nộp từ bản lưu local. Việc nộp lại sau hạn hoặc
sau khi mất phản hồi còn phụ thuộc vào quy tắc và khả năng xử lý của API nộp bài.

## Video ôn tập sau khi làm bài

Kết quả nộp bài và xem lại bài luyện đề, thi thử cần trả về `relatedVideo` trong
`details` của từng câu có video ôn tập. Đối tượng này cần có `videoId` (ID video
trong hệ thống) và có thể có `videoTitle`. Frontend hiển thị liên kết bất kể câu
trả lời đúng, sai hay chưa chọn, kể cả khi đáp án chưa được công bố. Backend cần
trả thông tin video cho tất cả các trường hợp đó.

Liên kết mở `/video?videoId=...`; trang video sử dụng API danh sách video và
`GET /api/v1/videos/{videoId}/learning-content` hiện có. API này cần trả nội dung
phát video hoặc danh sách video cần chứa thông tin phát của video tương ứng.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
