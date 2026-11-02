import { PageIntro } from '../components/PageIntro'

const videos = ['Cách ghi nhớ từ vựng hiệu quả', '3 lỗi thường gặp khi làm Reading', 'Chiến thuật Listening Part 2']

export function VideosPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <PageIntro description="Video bài giảng ngắn gọn, trực quan giúp bạn học đúng và nhớ lâu hơn." eyebrow="Học qua video" title="Video bài giảng" />
      <div className="grid gap-6 md:grid-cols-3">
        {videos.map((video) => (
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" key={video}>
            <div className="flex aspect-video items-center justify-center bg-slate-900 text-4xl text-cyan-400">▶</div>
            <div className="p-5">
              <h2 className="font-bold text-slate-900">{video}</h2>
              <p className="mt-2 text-sm text-slate-500">12 phút · IELTS</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
