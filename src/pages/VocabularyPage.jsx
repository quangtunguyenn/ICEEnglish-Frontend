import { PageIntro } from '../components/PageIntro'

const topics = ['Academic Word List', 'Từ vựng theo chủ đề', 'Cụm động từ thông dụng']

export function VocabularyPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <PageIntro
        description="Mở rộng vốn từ với các chủ đề được chọn lọc và bài tập ghi nhớ ngắn mỗi ngày."
        eyebrow="Vocabulary"
        title="Học từ vựng"
      />
      <div className="grid gap-5 md:grid-cols-3">
        {topics.map((topic, index) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            key={topic}
          >
            <span className="text-sm font-bold text-cyan-600">CHỦ ĐỀ 0{index + 1}</span>
            <h2 className="mt-4 text-xl font-bold text-slate-900">{topic}</h2>
            <p className="mt-2 text-slate-500">50 từ vựng · Flashcard</p>
          </article>
        ))}
      </div>
    </div>
  )
}
