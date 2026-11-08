# Kế hoạch tính năng đọc hiểu tiếng Anh

> **Trạng thái: đề xuất, chưa triển khai.** Bảng dữ liệu, JSON và API trong tài liệu này là hợp đồng dự kiến để frontend và backend thống nhất. Các API chưa thể sử dụng cho đến khi backend triển khai. Workspace được khảo sát là frontend; cấu trúc và công nghệ backend cần được xác nhận.

> **Cập nhật tích hợp:** Tài liệu này là kế hoạch ban đầu, không phải hợp đồng API hiện hành. Xem [hướng dẫn tích hợp đọc hiểu](./huong-dan-tich-hop-doc-hieu.md) để biết hợp đồng backend và hành vi frontend mới, đặc biệt việc trả lời từng câu thay cho nộp cả bài.

## 1. Mục tiêu và phạm vi

Tạo thư viện bài báo, bài đọc kiến thức, nội dung tạp chí và câu chuyện cho học sinh lớp 12. Trải nghiệm cần gần gũi, có tính giải trí nhưng vẫn trang trọng và có mục tiêu học tập:

- Luyện **skimming** để tìm ý chính, mục đích hoặc tiêu đề phù hợp.
- Luyện **scanning** để tìm nhanh dữ kiện, thời gian và đối tượng.
- Luyện suy luận, từ vựng trong ngữ cảnh và xác định từ thay thế.
- Ôn từ vựng riêng của từng bài, kèm nghĩa, phiên âm và ví dụ.
- Xem kết quả, đáp án, giải thích và đoạn văn chứa bằng chứng sau khi nộp.

Thời gian đọc chỉ là gợi ý; không coi đọc nhanh là đủ để đánh giá năng lực. Không tuyên bố phân bố dạng câu hỏi tuân thủ một cấu trúc đề thi cụ thể nếu chưa được xác minh.

### Quyền truy cập

- **Khách:** thấy danh sách tất cả bài đã publish; chỉ mở và làm bài được admin cho phép. Bài khác hiển thị khóa và yêu cầu đăng nhập.
- **Học sinh đã đăng nhập:** xem và làm tất cả bài đã publish theo quyền tài khoản.
- **Quản trị:** import JSON, xem trước, publish/archive và bật hoặc tắt quyền khách.
- Khách không có lịch sử được lưu. Việc lưu lịch sử học sinh cần thống nhất riêng; phương án bản đầu là không lưu lịch sử cho cả hai nhóm.

Backend phải kiểm tra quyền với từng request, kể cả khi người dùng thay ID. Khóa giao diện không thay thế kiểm tra quyền ở backend.

## 2. Nguyên tắc tách biệt hệ thống hiện tại

- Chỉ tạo bảng, index và API mới cho tính năng đọc hiểu; không sửa bảng, dữ liệu hay API cũ.
- Không tạo khóa ngoại từ các bảng mới đến bảng người dùng cũ. Tầng ứng dụng có thể dùng xác thực hiện tại để nhận biết học sinh và quản trị viên.
- Từ vựng bài đọc được lưu riêng; không thêm vào danh sách chuyên đề từ vựng của video. Có thể tái sử dụng giao diện và logic luyện từ vựng, không cần liên kết bảng `vocabularies` cũ.
- Cần chốt ý nghĩa của **“không đụng DB hiện tại”**: dùng database/schema riêng hoàn toàn, hoặc dùng cùng database nhưng chỉ tạo bảng mới. Nếu yêu cầu cách ly hoàn toàn, dùng database/schema và migration riêng; không mặc định cấu hình backend hiện tại hỗ trợ lựa chọn này.
- Không lưu lịch sử học sinh trong bản đầu nếu chưa chốt cách định danh, lưu trữ và quyền riêng tư. Không tự chuyển kết quả khách vào tài khoản sau đăng nhập.

## 3. Mô hình dữ liệu đề xuất

Tên, kiểu dữ liệu và cú pháp migration cần điều chỉnh theo hệ quản trị database thực tế. Dùng UUID làm khóa chính. Quan hệ:

```text
reading_topics 1 ── N reading_blogs
reading_blogs  1 ── N reading_questions 1 ── N reading_answers
reading_blogs  1 ── N reading_vocabularies
```

### 3.1. `reading_topics` — chủ đề

| Cột | Kiểu gợi ý | Ý nghĩa |
|---|---|---|
| `id` | UUID, PK | ID chủ đề |
| `name` | varchar, not null | Tên hiển thị |
| `slug` | varchar, unique | Mã ổn định để lọc, ví dụ `technology` |
| `created_at`, `updated_at` | timestamp | Thời gian tạo, cập nhật |

Đây là chủ đề bài đọc, tách biệt các chuyên đề video.

### 3.2. `reading_blogs` — bài đọc

| Cột | Kiểu gợi ý | Ý nghĩa |
|---|---|---|
| `id` | UUID, PK | ID bài đọc |
| `topic_id` | UUID, FK → `reading_topics` | Chủ đề chính |
| `title` | varchar, not null | Tiêu đề |
| `summary` | text | Mô tả ngắn trên danh sách |
| `content_type` | enum/varchar | `ARTICLE`, `MAGAZINE`, `STORY`, `PASSAGE` |
| `difficulty` | enum/varchar | `EASY`, `MEDIUM`, `HARD` |
| `estimated_reading_minutes` | integer, nullable | Thời gian tham khảo; lớn hơn 0 nếu có |
| `passage_blocks` | JSON hoặc kiểu tương đương | Các đoạn gốc và bản dịch tương ứng |
| `guest_accessible` | boolean, default false | Admin cho phép khách mở bài |
| `status` | enum/varchar | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `revision` | integer | Phiên bản nội dung và câu hỏi để phát hiện dữ liệu cũ khi nộp |
| `source_name`, `source_url` | nullable | Nguồn khi được phép sử dụng |
| `published_at` | timestamp, nullable | Thời điểm xuất bản |
| `created_at`, `updated_at` | timestamp | Thời gian tạo, cập nhật |

Đề xuất lưu bài theo đoạn để hiển thị bản dịch tương ứng và liên kết bằng chứng:

```json
{
  "id": "p1",
  "text": "Artificial intelligence has changed how people work.",
  "translation": "Trí tuệ nhân tạo đã thay đổi cách con người làm việc."
}
```

Bản đầu ưu tiên văn bản thuần; frontend tự trình bày đoạn văn. Nếu cần HTML, phải quy định danh sách thẻ và thuộc tính cho phép, sanitize ở backend và render an toàn ở frontend; không đưa HTML import chưa kiểm tra trực tiếp vào trang.

### 3.3. `reading_questions` — câu hỏi

| Cột | Kiểu gợi ý | Ý nghĩa |
|---|---|---|
| `id` | UUID, PK | ID câu hỏi |
| `blog_id` | UUID, FK → `reading_blogs` | Bài đọc sở hữu |
| `order_index` | integer, not null | Thứ tự hiển thị |
| `content` | text, not null | Nội dung câu hỏi |
| `skill_type` | enum/varchar | Kỹ năng chính |
| `evidence_block_ids` | JSON hoặc kiểu tương đương | ID đoạn chứa bằng chứng |
| `explanation` | text, not null | Giải thích đáp án và cách tìm bằng chứng |

Kỹ năng đề xuất: `SKIMMING`, `SCANNING`, `INFERENCE`, `VOCABULARY_IN_CONTEXT`, `REFERENCE`. Đây là phân loại luyện tập dự kiến, có thể mở rộng sau khi thống nhất nội dung.

Không trả `evidence_block_ids` và lời giải trước khi nộp nếu chúng có thể tiết lộ đáp án.

### 3.4. `reading_answers` — lựa chọn

| Cột | Kiểu gợi ý | Ý nghĩa |
|---|---|---|
| `id` | UUID, PK | ID lựa chọn |
| `question_id` | UUID, FK → `reading_questions` | Câu hỏi sở hữu |
| `option_key` | char(1) | `A`, `B`, `C` hoặc `D` |
| `content` | text, not null | Nội dung lựa chọn |
| `is_correct` | boolean | Đánh dấu đáp án đúng |
| `explanation` | text, nullable | Giải thích riêng cho lựa chọn |

Bản đầu đề xuất mỗi câu có bốn lựa chọn và đúng một đáp án đúng. Kiểm tra khi import và trước publish. Response làm bài không được chứa `is_correct` hoặc lời giải.

### 3.5. `reading_vocabularies` — từ vựng bài đọc

| Cột | Kiểu gợi ý | Ý nghĩa |
|---|---|---|
| `id` | UUID, PK | ID mục từ |
| `blog_id` | UUID, FK → `reading_blogs` | Bài đọc sở hữu |
| `order_index` | integer, not null | Thứ tự hiển thị |
| `word` | varchar, not null | Từ hoặc cụm từ |
| `phonetic` | varchar, nullable | Phiên âm |
| `meaning` | text, not null | Nghĩa tiếng Việt |
| `example_sentence` | text, nullable | Ví dụ |
| `passage_block_id` | varchar, nullable | Đoạn chứa từ để quay về ngữ cảnh |

Không tạo liên kết tới `vocabularies` cũ trong bản đầu. Tái sử dụng component luyện từ vựng không yêu cầu dùng chung bảng.

### 3.6. Ràng buộc và index

- `UNIQUE (slug)` cho chủ đề.
- `UNIQUE (blog_id, order_index)` cho câu hỏi và từ vựng.
- `UNIQUE (question_id, option_key)` cho lựa chọn.
- Index danh sách bài theo `(status, published_at, id)` và lọc chủ đề theo `(topic_id, status, published_at, id)`.
- Cân nhắc index `(status, guest_accessible, published_at, id)` theo dữ liệu và kế hoạch truy vấn thực tế; không cần thêm index trùng với index đã bao phủ bởi unique constraint.
- Kiểm tra ID đoạn duy nhất trong bài; ID đoạn được tham chiếu phải tồn tại. Kiểm tra thời gian gợi ý dương và tính hợp lệ của enum.
- Chỉ xóa liên đới trong nhóm bảng đọc hiểu; ưu tiên archive thay vì xóa vật lý bài đã publish.
- Không cần bảng lịch sử cho bản đầu theo phương án đề xuất. Nếu thêm sau, thiết kế bảng mới và xác định cách liên hệ tài khoản mà không sửa bảng cũ.

## 4. JSON import đề xuất

JSON ban đầu có `passage_translate :+/` không hợp lệ. Mẫu dưới đây dùng các đoạn song ngữ, chứa đáp án để admin import và là nội dung minh họa ngắn. Bài thực tế có thể dài hơn và có thêm câu hỏi.

```json
{
  "schema_version": 1,
  "blog": {
    "title": "Small Gardens, Big Changes",
    "topic": {
      "slug": "environment",
      "name": "Environment"
    },
    "content_type": "ARTICLE",
    "difficulty": "MEDIUM",
    "summary": "How a school garden can change a community.",
    "estimated_reading_minutes": 3,
    "guest_accessible": false,
    "source_name": null,
    "source_url": null
  },
  "passage_blocks": [
    {
      "id": "p1",
      "text": "Students at a city school turned an empty space into a small garden. They wanted to grow vegetables and learn more about nature.",
      "translation": "Học sinh tại một trường trong thành phố đã biến một khu đất trống thành khu vườn nhỏ. Các em muốn trồng rau và tìm hiểu thêm về thiên nhiên."
    },
    {
      "id": "p2",
      "text": "After six months, the garden provided fresh food for school lunches. It also gave neighbours a place to share ideas and work together.",
      "translation": "Sau sáu tháng, khu vườn cung cấp thực phẩm tươi cho bữa trưa ở trường. Đây cũng là nơi hàng xóm chia sẻ ý tưởng và cùng làm việc."
    }
  ],
  "vocabularies": [
    {
      "order_index": 1,
      "word": "provide",
      "phonetic": "/prəˈvaɪd/",
      "meaning": "cung cấp",
      "example_sentence": "The garden provides fresh vegetables.",
      "passage_block_id": "p2"
    },
    {
      "order_index": 2,
      "word": "neighbour",
      "phonetic": "/ˈneɪ.bər/",
      "meaning": "người hàng xóm",
      "example_sentence": "Neighbours work together in the garden.",
      "passage_block_id": "p2"
    }
  ],
  "questions": [
    {
      "order_index": 1,
      "content": "What is the main idea of the passage?",
      "skill_type": "SKIMMING",
      "evidence_block_ids": ["p1", "p2"],
      "explanation": "Cả hai đoạn cho thấy khu vườn mang lại lợi ích cho trường học và cộng đồng.",
      "answers": [
        {
          "option_key": "A",
          "content": "A school garden can benefit both students and neighbours.",
          "is_correct": true,
          "explanation": "Đáp án bao quát ý chính của cả bài."
        },
        {
          "option_key": "B",
          "content": "All city schools have large farms.",
          "is_correct": false,
          "explanation": "Bài chỉ nói về một khu vườn nhỏ."
        },
        {
          "option_key": "C",
          "content": "Students should stop studying nature.",
          "is_correct": false,
          "explanation": "Điều này trái với mục đích được nêu ở đoạn đầu."
        },
        {
          "option_key": "D",
          "content": "Neighbours refused to use the garden.",
          "is_correct": false,
          "explanation": "Đoạn hai nói hàng xóm cùng chia sẻ và làm việc."
        }
      ]
    },
    {
      "order_index": 2,
      "content": "How long did it take for the garden to provide food for school lunches?",
      "skill_type": "SCANNING",
      "evidence_block_ids": ["p2"],
      "explanation": "Tìm cụm chỉ thời gian ở đầu đoạn hai: 'After six months'.",
      "answers": [
        { "option_key": "A", "content": "One month", "is_correct": false },
        { "option_key": "B", "content": "Three months", "is_correct": false },
        { "option_key": "C", "content": "Six months", "is_correct": true },
        { "option_key": "D", "content": "One year", "is_correct": false }
      ]
    }
  ]
}
```

### Quy tắc import

1. Import tạo bài `DRAFT`, kể cả khi `guest_accessible` là `true`; chỉ publish mới đưa bài vào danh sách người học.
2. Kiểm tra phiên bản schema, trường bắt buộc, độ dài, thứ tự không trùng, ID đoạn, kỹ năng, bốn lựa chọn và một đáp án đúng.
3. Tìm chủ đề theo `slug`; nếu chưa có thì tạo trong cùng transaction. Nếu slug đã tồn tại với tên khác, báo lỗi rõ để admin xử lý.
4. Toàn bộ import thành công hoặc rollback; trả lỗi có đường dẫn cụ thể như `questions[1].answers`.
5. Giới hạn kích thước file và số đoạn/từ/câu hỏi theo cấu hình backend; thống nhất các ngưỡng trước triển khai.
6. Import tạo bài mới, không tự ghi đè bài cũ. Quy trình chỉnh sửa hoặc import lại cần thiết kế riêng.
7. Chỉ sử dụng nội dung tự viết hoặc có quyền đăng tải; lưu thông tin nguồn khi cần. File import của admin có đáp án, nhưng API công khai không được trả đáp án trước khi nộp.

## 5. Hợp đồng API mới đề xuất

Các đường dẫn sau chỉ là đề xuất và không thay đổi API cũ. Response, xác thực, phân trang và mã lỗi cần xác nhận với backend.

### 5.1. Quản trị

| Phương thức | Đường dẫn | Mục đích |
|---|---|---|
| `POST` | `/api/v1/admin/reading-blogs/import` | Upload JSON qua `multipart/form-data`, field `file`; tạo DRAFT |
| `GET` | `/api/v1/admin/reading-blogs` | Danh sách, tìm kiếm, lọc trạng thái/chủ đề |
| `GET` | `/api/v1/admin/reading-blogs/{id}` | Preview đầy đủ, bao gồm đáp án |
| `PATCH` | `/api/v1/admin/reading-blogs/{id}/publish` | Kiểm tra hợp lệ và publish |
| `PATCH` | `/api/v1/admin/reading-blogs/{id}/archive` | Ẩn khỏi danh sách người học |
| `PATCH` | `/api/v1/admin/reading-blogs/{id}/guest-access` | Bật/tắt quyền khách |

Body ví dụ cho `guest-access`:

```json
{ "guestAccessible": true }
```

Backend kiểm tra role; việc ẩn nút trên frontend không phải kiểm soát quyền. Cần xác nhận chỉ `ADMIN` hay cả `TEACHER` được thao tác.

### 5.2. Học sinh

| Phương thức | Đường dẫn | Mục đích |
|---|---|---|
| `GET` | `/api/v1/reading-blogs?topic=...&page=0&size=12` | Danh sách bài `PUBLISHED` |
| `GET` | `/api/v1/reading-blogs/{id}` | Nội dung, từ vựng, câu hỏi và lựa chọn không có đáp án |
| `POST` | `/api/v1/reading-blogs/{id}/submit` | Chấm và trả kết quả |

### 5.3. Khách

| Phương thức | Đường dẫn | Mục đích |
|---|---|---|
| `GET` | `/api/v1/guest/reading-blogs?topic=...&page=0&size=12` | Danh sách bài `PUBLISHED`, kèm `accessible` |
| `GET` | `/api/v1/guest/reading-blogs/{id}` | Chi tiết bài được mở cho khách |
| `POST` | `/api/v1/guest/reading-blogs/{id}/submit` | Chấm bài được mở, không lưu lịch sử |

Ví dụ response danh sách:

```json
{
  "items": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "title": "Small Gardens, Big Changes",
      "topic": "Environment",
      "summary": "How a school garden can change a community.",
      "difficulty": "MEDIUM",
      "estimatedReadingMinutes": 3,
      "accessible": true
    }
  ],
  "page": 0,
  "size": 12,
  "totalElements": 1,
  "totalPages": 1
}
```

Danh sách khách chỉ trả metadata để hiển thị, kể cả với bài khóa; không trả nội dung, câu hỏi, đáp án hoặc từ vựng của bài khóa. Backend kiểm tra trạng thái và quyền ở mọi request. Đề xuất `404` khi khách yêu cầu bài khóa, chưa publish hoặc không tồn tại.

### 5.4. Nộp bài và kết quả

Body thống nhất dự kiến:

```json
{
  "revision": 1,
  "answers": [
    {
      "questionId": "22222222-2222-2222-2222-222222222222",
      "selectedOption": "A"
    },
    {
      "questionId": "33333333-3333-3333-3333-333333333333",
      "selectedOption": null
    }
  ]
}
```

- Backend kiểm tra bài đang publish, quyền truy cập, revision, câu hỏi thuộc bài, không có câu trùng và lựa chọn hợp lệ.
- Câu không gửi hoặc `null` được tính bỏ trống. Không tin đáp án hay điểm do client cung cấp.
- Nếu bài đã thay đổi sau lúc tải, đề xuất trả `409`, yêu cầu người dùng tải lại; không chấm trên phiên bản khác.
- Kết quả trả tổng đúng/sai/bỏ trống, kết quả theo kỹ năng, lựa chọn đã chọn, đáp án đúng, lời giải và ID đoạn bằng chứng.
- Bản đầu hiển thị số câu đúng/tổng câu; không mặc định áp dụng công thức điểm của đề thi vì số câu bài đọc có thể khác.
- Đề xuất `400` cho dữ liệu không hợp lệ, `401` khi cần đăng nhập, `403` cho thao tác không đủ quyền và `404` cho nội dung không thể truy cập. Hợp đồng lỗi cuối cùng cần backend xác nhận.

## 6. Trải nghiệm frontend

### 6.1. Danh sách và điều hướng

Thêm mục **Đọc hiểu** vào thanh điều hướng và các route dự kiến:

- `/doc-hieu`: danh sách, tìm kiếm/lọc chủ đề, phân trang.
- `/doc-hieu/:blogId`: nội dung bài và câu hỏi.
- `/doc-hieu/:blogId/tu-vung`: luyện từ vựng của bài.

Khách thấy nhãn **Miễn phí** hoặc **Đăng nhập**; bấm bài khóa chuyển tới giao diện đăng nhập. Đề xuất quay lại bài vừa chọn sau khi đăng nhập và tải lại dữ liệu theo quyền mới. Học sinh thấy mọi bài đã publish. Có trạng thái loading, không có kết quả, lỗi và thử lại.

### 6.2. Đọc và luyện kỹ năng

- Hiển thị tiêu đề, chủ đề, độ khó, thời gian đọc tham khảo và từng đoạn văn.
- Cho phép bật/tắt bản dịch theo đoạn; có thể cho xem câu hỏi trước để luyện tìm thông tin.
- Có nút **Luyện tập câu hỏi** và **Từ vựng cho bài đọc này**.
- Hiển thị nhãn kỹ năng, lựa chọn A–D và cho phép bỏ trống.
- Sau khi nộp, hiển thị đúng/sai, lời giải, liên kết về đoạn chứa bằng chứng và tổng kết theo kỹ năng.
- Có thể dùng đồng hồ phía client để tự theo dõi; không coi đó là giới hạn được backend xác thực.
- Đảm bảo giao diện mobile, hỗ trợ bàn phím và nhãn cho công nghệ hỗ trợ.

Đề xuất bản đầu cho phép xem bản dịch trước khi làm để phù hợp mục tiêu vừa học vừa đọc. Chế độ luyện thi hạn chế bản dịch có thể xem xét riêng sau khi thống nhất.

### 6.3. Từ vựng bài đọc

Trang [VocabularyPage.jsx](../src/pages/VocabularyPage.jsx) hiện gắn với danh sách video và luồng từ vựng video. Đề xuất:

1. Tách giao diện thẻ lật/trắc nghiệm và logic luyện phù hợp thành component dùng chung.
2. Giữ nguyên danh sách và hành vi từ vựng video.
3. Route từ vựng bài đọc lấy dữ liệu theo `blogId` từ API đọc hiểu tương ứng với trạng thái đăng nhập, rồi truyền từ vựng vào component chung.
4. Có nút quay lại bài đọc; tải lại trang vẫn tải dữ liệu qua API và được backend kiểm tra quyền, không phụ thuộc duy nhất vào `location.state`.
5. Không thêm bài đọc vào danh sách chuyên đề video và không dùng API video để lấy từ vựng bài đọc.

### 6.4. Quản trị frontend

Thêm khu vực quản lý bài đọc trong [AdminPage.jsx](../src/pages/AdminPage.jsx), tham khảo UX import và preview hiện có:

- Chọn JSON, import và hiển thị lỗi theo trường.
- Preview bài, bản dịch, từ vựng, câu hỏi và đáp án.
- Publish, archive, bật/tắt quyền khách và hiển thị trạng thái rõ ràng.

Thêm route ở [App.jsx](../src/App.jsx), điều hướng ở [MainLayout.jsx](../src/layouts/MainLayout.jsx) và các phương thức API mới ở [api.js](../src/services/api.js), không thay đổi hành vi API cũ.

## 7. Các giai đoạn triển khai

1. **Chốt hợp đồng:** xác nhận phạm vi DB, role quản trị, lịch sử, schema JSON, API, response và quy tắc lỗi.
2. **Backend dữ liệu:** migration chỉ tạo cấu trúc mới; import transaction, validate, preview và vòng đời publish.
3. **Backend truy cập/làm bài:** API học sinh và khách, kiểm tra quyền, ẩn đáp án trước nộp, chấm và trả kết quả.
4. **Frontend quản trị:** import, preview, publish/archive, bật quyền khách.
5. **Frontend người học:** danh sách, đọc, luyện câu hỏi, kết quả và điều hướng đăng nhập.
6. **Từ vựng dùng chung:** tách component, tạo route bài đọc, bảo đảm luồng và danh sách video không đổi.
7. **Tích hợp và phát hành:** kiểm thử với backend thật, cấu hình nội dung mẫu, kiểm tra phân quyền trước khi mở cho người dùng.

## 8. Kiểm thử nghiệm thu

- Import hợp lệ tạo đầy đủ dữ liệu ở `DRAFT`; JSON lỗi rollback và chỉ rõ trường sai. Kiểm tra ID đoạn, thứ tự, bốn lựa chọn và một đáp án đúng.
- Bài `DRAFT`/`ARCHIVED` không xuất hiện với học sinh và khách; học sinh xem được đầy đủ bài `PUBLISHED`.
- Khách thấy metadata bài khóa nhưng không đọc, lấy từ vựng hay nộp được bằng cách thay ID; kiểm tra backend trực tiếp, không chỉ qua giao diện.
- Không lộ đáp án/lời giải trước khi nộp; sau nộp hiện kết quả, kỹ năng và đoạn bằng chứng đúng.
- Nộp câu trùng, sai ID, sai lựa chọn hoặc revision cũ bị từ chối; kiểm tra câu bỏ trống.
- Luyện từ vựng mở đúng bộ từ, tải lại route hoạt động và danh sách chuyên đề video không thay đổi.
- Khách không tạo lịch sử; không thay đổi bảng hay API cũ. Kiểm tra luồng hiện tại của học sinh và khách không bị hồi quy.
- Kiểm tra xử lý nội dung không an toàn, file lớn, phân trang, lỗi kết nối, mobile và bàn phím.

## 9. Các quyết định cần chốt

| Vấn đề | Phương án khuyến nghị | Cần xác nhận |
|---|---|---|
| Phạm vi DB | Database/schema riêng nếu yêu cầu cách ly hoàn toàn | DB riêng hay chỉ tạo bảng mới trong DB hiện tại? |
| Lịch sử học sinh | Bản đầu không lưu cho cả khách và học sinh | Có cần lưu cho học sinh không? |
| Quyền quản trị | Backend kiểm tra role cho mọi thao tác | Chỉ `ADMIN` hay cả `TEACHER`? |
| Kết quả | Số câu đúng/tổng câu, thống kê theo kỹ năng | Có cần quy đổi điểm không? |
| Định dạng bài | Văn bản thuần theo đoạn | Có bắt buộc hỗ trợ HTML có định dạng không? |
| Nội dung và import lại | Nội dung có quyền sử dụng; import tạo bài mới, không ghi đè | Quy trình biên tập, nguồn và cập nhật bài đã publish? |

Sau khi thống nhất, cần chốt hợp đồng backend chính thức trước khi frontend tích hợp; không coi tên bảng, endpoint hay response trong tài liệu này là hệ thống đã tồn tại.
