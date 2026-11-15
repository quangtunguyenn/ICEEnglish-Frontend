export function PageIntro({ eyebrow, title, description }) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-cyan-600">
        {eyebrow}
      </p>
      <h1 className="text-4xl font-gf font-extrabold tracking-tight text-ice-gold-700 sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>
    </div>
  )
}

export function BrandPageIntro({ title, description, eyebrow, logo = false }) {
  return (
    <header className="relative mb-8 overflow-hidden rounded-[1.75rem] bg-[#102b5c] px-6 py-8 text-white shadow-[0_20px_50px_-30px_rgba(16,43,92,0.65)] sm:px-10 sm:py-10">
      {logo ? (
        <img alt="" aria-hidden="true" className="pointer-events-none absolute right-0 top-1/2 w-40 -translate-y-1/2 opacity-20 mix-blend-screen grayscale invert sm:right-6 sm:w-64" src="/ice_english_emblem_vector.svg" />
      ) : (
        <>
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border border-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute right-8 top-2 h-48 w-48 rounded-full border border-ice-gold-300/15" />
        </>
      )}
      <div className="relative max-w-3xl">
        <p className="flex items-center text-lg gap-2 font-cal-sans font-extrabold uppercase  text-ice-gold">
          <span aria-hidden="true" className="h-1.5 w-14  bg-ice-gold" />
          ICE English / {eyebrow}
        </p>
        <h1 className="mt-4 font-gf text-3xl font-bold tracking-tight text-white sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
          {description}
        </p>
      </div>
    </header>
  )
}
