# Yêu cầu backend: phiên âm và ví dụ từ vựng video

> **Cập nhật:** Backend đã cung cấp hướng dẫn hỗ trợ các trường trong tài liệu này. Trước khi sử dụng phải áp dụng migration `V7__Add_video_vocabulary_details.sql` theo quy trình database của backend; migration không tự chạy. Nội dung bên dưới ghi lại yêu cầu và hợp đồng tích hợp.

## 1. Mục tiêu

Bổ sung phiên âm và câu ví dụ vào từ vựng của video/chuyên đề. Học sinh bấm **Luyện tập từ vựng bài học này** trên trang video vẫn được chuyển sang trang từ vựng như hiện tại.

Hiển thị flashcard theo yêu cầu:

| Mặt thẻ | Nội dung |
|---|---|
| Tiếng Anh | Từ tiếng Anh, phiên âm và câu ví dụ tiếng Anh |
| Tiếng Việt | Nghĩa tiếng Việt, phiên âm và bản dịch tiếng Việt của câu ví dụ |

Backend cần lưu và trả **bản dịch tiếng Việt của câu ví dụ** để frontend hiển thị tại khu vực từ vựng trên trang video và mặt tiếng Việt của flashcard.

Các trường mới là bổ sung; không thay đổi nội dung, đáp án homework, quyền truy cập video hoặc danh sách chuyên đề hiện có.

## 2. Bổ sung JSON import learning bundle

Endpoint import hiện frontend đang gọi: `POST /api/v1/videos/learning-bundle`, `multipart/form-data`, field `file`.

Đề xuất mỗi phần tử trong `vocabularies` nhận thêm ba trường:

| Trường JSON | Ý nghĩa | Bắt buộc |
|---|---|---|
| `word` | Từ hoặc cụm từ tiếng Anh | Theo quy tắc hiện tại |
| `meaning` | Nghĩa tiếng Việt | Theo quy tắc hiện tại |
| `phonetic` | Phiên âm, ví dụ `/ɡɑːr.dən/` | Không |
| `example_sentence` | Câu ví dụ tiếng Anh | Không |
| `example_sentence_translate` | Bản dịch tiếng Việt của câu ví dụ | Không |

Ví dụ bundle rút gọn; `questions` chỉ minh họa cấu trúc, không thay thế các quy tắc import homework hiện tại:

```json
{
  "video": {
    "title": "CHUYÊN ĐỀ 1 - THÌ CỦA ĐỘNG TỪ",
    "videoUrl": "https://example.com/video",
    "answers_url": "https://example.com/answers",
    "documentUrl": "https://example.com/document"
  },
  "homework": {
    "title": "Homework - Thì Của Động Từ",
    "questions": [
      {
        "orderIndex": 24,
        "content": "Look! The children ______ in the garden.",
        "options": {
          "A": "have played",
          "B": "are playing",
          "C": "played",
          "D": "play"
        },
        "correctOption": "B",
        "explanation": "Look! là dấu hiệu của thì hiện tại tiếp diễn."
      }
    ]
  },
  "vocabularies": [
    {
      "word": "garden",
      "meaning": "khu vườn",
      "phonetic": "/ˈɡɑːr.dən/",
      "example_sentence": "The children are playing in the garden.",
      "example_sentence_translate": "Bọn trẻ đang chơi trong vườn."
    },
    {
      "word": "knock",
      "meaning": "gõ (cửa)"
    }
  ]
}
```

Ba trường mới có thể vắng mặt hoặc `null`. Bundle cũ chỉ có `word` và `meaning` vẫn phải import được theo hành vi hiện tại. Không yêu cầu import lại dữ liệu cũ để video hoặc từ vựng tiếp tục hoạt động.

Backend cần:

- Đọc và lưu đúng các trường mới theo từng mục từ; bảo toàn tiếng Việt, ký tự phiên âm IPA và dấu câu Unicode.
- Kiểm tra kiểu chuỗi và giới hạn độ dài theo cấu trúc backend; báo lỗi cụ thể khi dữ liệu không hợp lệ, không âm thầm bỏ qua các trường.
- Nếu có bản dịch mà thiếu câu ví dụ gốc, nên báo lỗi rõ để tránh dữ liệu khó hiểu; quy tắc này cần backend xác nhận trước khi áp dụng.
- Giữ nguyên tính toàn vẹn và cách xử lý lỗi import bundle hiện tại; không tạo dữ liệu dở dang nếu quá trình import thất bại.
- Không thay đổi ý nghĩa các trường khác trong bundle.

## 3. Lưu trữ dữ liệu

- Kiểm tra bảng/entity từ vựng video hiện tại; bổ sung nơi lưu riêng cho `phonetic`, câu ví dụ và bản dịch nếu chưa có.
- Các cột mới nên cho phép `NULL` để tương thích bản ghi cũ. Không suy diễn phiên âm hay câu ví dụ cho dữ liệu cũ.
- Nếu backend đã có cột câu ví dụ tương đương, ưu tiên tái sử dụng sau khi xác nhận ngữ nghĩa; không tạo cột trùng chỉ vì khác tên.
- Nếu cần migration, tạo migration theo quy trình backend và kiểm tra trên môi trường thử nghiệm trước. Không chạy SQL trên production ngoài quy trình triển khai/backup của dự án.
- Đây là yêu cầu cho từ vựng video; không thêm dữ liệu vào các bảng đọc hiểu `reading_*` hoặc thay đổi quyền truy cập nội dung khách.

## 4. API đọc dữ liệu cần cập nhật

Frontend đang lấy từ vựng qua cả nội dung bài học và endpoint từ vựng riêng. Cần trả cùng dữ liệu mới trên tất cả bốn đường dẫn, theo đúng quyền hiện tại:

| Nhóm | API | Vị trí dữ liệu |
|---|---|---|
| Học sinh | `GET /api/v1/videos/{videoId}/learning-content` | Các mục trong `vocabularies` |
| Học sinh | `GET /api/v1/videos/{videoId}/vocabularies` | Các mục từ vựng trong response |
| Khách | `GET /api/v1/guest/videos/{videoId}/learning-content` | Các mục trong `vocabularies` của video mẫu được phép |
| Khách | `GET /api/v1/guest/videos/{videoId}/vocabularies` | Các mục từ vựng của video mẫu được phép |

Không thay đổi wrapper, cấu trúc danh sách, trường đang có hoặc cách xác thực của các response hiện tại. Các API khách vẫn không yêu cầu đăng nhập và chỉ trả nội dung video mẫu được cấu hình; video khóa phải tiếp tục bị backend từ chối, kể cả khi thay ID.

### Tên trường response đề xuất

Backend xác nhận dùng camelCase trong DTO response, giữ `word`, `meaning` và các trường cũ:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "word": "garden",
  "meaning": "khu vườn",
  "phonetic": "/ˈɡɑːr.dən/",
  "exampleSentence": "The children are playing in the garden.",
  "exampleSentenceTranslate": "Bọn trẻ đang chơi trong vườn."
}
```

Đây chỉ là **ví dụ một phần tử**, không quy định wrapper của endpoint. Với dữ liệu cũ, ba trường mới trả về `null`.

Import dùng `snake_case` như yêu cầu và cũng nhận alias `exampleSentence`, `exampleSentenceTranslate`; response dùng `camelCase`. Phiên âm tối đa 250 ký tự Unicode, mỗi câu ví dụ và bản dịch tối đa 5.000 ký tự Unicode. Bản dịch không rỗng yêu cầu câu ví dụ không rỗng.

## 5. Phần frontend

- Cập nhật trang video hiển thị phiên âm, câu ví dụ và bản dịch khi có; không hiển thị giá trị `null` như chuỗi chữ.
- Khi bấm luyện từ vựng, tiếp tục điều hướng sang trang từ vựng và giữ đầy đủ trường mới trong dữ liệu chuyển trang.
- Khi chọn chuyên đề trực tiếp tại trang từ vựng, lấy cùng các trường từ API từ vựng. Hai đường vào phải hiển thị nhất quán.
- Mặt tiếng Anh hiển thị `word`, `phonetic`, `exampleSentence`; mặt tiếng Việt hiển thị `meaning`, `phonetic`, `exampleSentenceTranslate`.
- Nếu trường mới không có, ẩn phần tương ứng; thẻ cũ vẫn hiển thị từ và nghĩa bình thường.

[VocabularyPage.jsx](../src/pages/VocabularyPage.jsx) giữ các trường mới khi nhận dữ liệu từ trang video hoặc API từ vựng. [VideosPage.jsx](../src/pages/VideosPage.jsx) hiển thị các trường và chuyển dữ liệu sang trang luyện tập.

## 6. Kiểm thử nghiệm thu backend

1. Import bundle có đủ ba trường mới; đọc lại qua cả hai API học sinh và so sánh chính xác từng giá trị Unicode.
2. Với video mẫu, đọc lại cùng dữ liệu qua cả hai API khách; video không được phép vẫn bị từ chối.
3. Import bundle cũ không có các trường mới và kiểm tra các bản ghi cũ vẫn đọc được, không ảnh hưởng homework/video.
4. Kiểm tra thiếu từng trường tùy chọn, giá trị `null`, kiểu sai, giới hạn độ dài và thông báo lỗi. Bản dịch không rỗng khi không có câu gốc phải bị từ chối.
5. Đảm bảo không làm mất hoặc đổi các trường response cũ; không lộ nội dung video khóa.
6. Sau khi tích hợp frontend, kiểm tra hai đường vào trang luyện tập, hai mặt thẻ và việc điều hướng từ video; dữ liệu trống không gây lỗi.

## 7. Lưu ý triển khai

- Áp dụng migration V7 theo quy trình backend trước khi dùng các trường mới.
- Hướng dẫn backend mô tả hợp đồng mới; cần xác minh môi trường triển khai đã được cập nhật trước khi kiểm thử dữ liệu thực.
