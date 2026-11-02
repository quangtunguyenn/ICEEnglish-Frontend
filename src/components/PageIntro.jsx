export function PageIntro({ eyebrow, title, description }) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-cyan-600">
        {eyebrow}
      </p>
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>
    </div>
  )
}
