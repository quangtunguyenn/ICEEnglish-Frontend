# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## SEO và domain triển khai

Các trang công khai có title, description, canonical, Open Graph, Twitter Card và
dữ liệu cấu trúc được cập nhật theo đường dẫn. Trang đăng nhập, quản trị, giáo
viên, làm bài và kết quả được đánh dấu `noindex`; sitemap chỉ liệt kê các trang
công khai.

Domain production mặc định là `https://iceenglish.vn`. Nếu domain triển khai
thay đổi, đặt `VITE_SITE_URL` khi build và cập nhật cùng domain trong
`index.html`, `public/robots.txt` và `public/sitemap.xml`. Chỉ gửi sitemap tới
Google Search Console sau khi domain đã hoạt động và được xác minh.

Ứng dụng hiện vẫn là Vite SPA: metadata theo route được thêm sau khi JavaScript
chạy, còn nội dung bài đọc tải từ API. Muốn bot nhận nội dung và metadata ngay
trong HTML ban đầu, cần một bước triển khai SSR/SSG riêng; bước SEO hiện tại
không thay đổi giao diện hay hệ thống render.

## Form tư vấn khóa học

Form trên trang chủ và trang đăng nhập gửi yêu cầu công khai tới
`POST /api/v1/consultation-requests`. Nội dung ICE Masterclass chỉ hiển thị
trên form, không được gửi hoặc lưu vì API không có trường tương ứng.
ADMIN và TEACHER có thể xem, lọc theo trạng thái/ngày theo giờ Việt Nam,
và đổi trạng thái trong trang quản trị.
Sau khi đăng nhập, TEACHER được chuyển tới không gian riêng tại `/giao-vien`
để trình bày thống kê thi thử; các công cụ quản lý nội dung vẫn có tại
`/quan-tri`.
Backend cần áp dụng migration `V10__Create_consultation_requests.sql` trước khi sử dụng.
Khi build triển khai, đặt `VITE_API_BASE_URL` trỏ đến backend; nếu frontend và
backend khác origin, backend phải cho phép CORS phù hợp. Mặc định production
trỏ tới `http://localhost:8080`, không phù hợp với người dùng trên Internet.

## Lịch sử luyện đề

Trang luyện đề hiển thị liên kết lịch sử khi API danh sách đề trả
`hasSubmitted: true` hoặc `submittedCount > 0`. Nếu thiếu cả hai trường,
frontend kiểm tra lịch sử của đề; lỗi kiểm tra được thông báo và có thể thử lại.
Lịch sử được phân trang và hiển thị thời điểm nộp theo giờ Việt Nam. Chi tiết
của từng lượt được tải từ server theo `submissionId`, kể cả khi mở trực tiếp
hoặc tải lại trang. Hợp đồng API được mô tả trong
[PRACTICE-HISTORY-API.md](./PRACTICE-HISTORY-API.md).

## Quản lý học sinh

ADMIN có thể tìm theo họ tên, lọc trạng thái và kích hoạt hoặc vô hiệu hóa
học sinh trong trang quản trị. Vô hiệu hóa là xóa mềm; JWT chưa hết hạn có thể
hoạt động lại khi tài khoản được kích hoạt. Backend cần áp dụng migration
`V11__Add_user_active_status.sql` trước khi sử dụng.

## Lưu bài thi thử trên trình duyệt

Khi chọn **Vào phòng thi**, học sinh thực hành đăng nhập trên giao diện mô
phỏng rồi kiểm tra thông tin trước khi bấm **Vào thi**. Việc so sánh mã thí
sinh (`studentIrn`) và mật khẩu luyện tập (`passwordMock`) chỉ diễn ra trên
frontend, không phải xác thực bảo mật; API làm bài vẫn sử dụng cơ chế xác thực
hiện có. Trang làm bài có thể được mở trực tiếp mà không qua bước mô phỏng.

Admin có thể nhập tùy chọn mã IRN, mật khẩu luyện tập, ngày sinh và giới tính
khi tạo học sinh. API nhận `studentIrn`, `passwordMock`, `dob` (định dạng
`dd/MM/yyyy`) và `gender`; profile trả lại các trường này. Tài khoản thiếu mã
IRN hoặc mật khẩu luyện tập cần liên hệ quản trị viên. Khách dùng mã
`9999010120091` và mật khẩu `guest` được điền sẵn.

Lượt thi mới chỉ bắt đầu khi bấm **Vào thi**; lượt đang làm tiếp tục tính giờ
khi quay lại các màn hình mô phỏng.

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
