import { Link } from 'react-router-dom'
import { BrandPageIntro } from './PageIntro'

export function ResultOverview({ backLabel, backState, backTo, description, eyebrow, stats, title }) {
  return (
    <>
      <Link
        className="mb-5 inline-flex items-center gap-2 rounded-lg text-sm font-bold text-ice-navy transition hover:text-ice-gold-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ice-gold"
        state={backState}
        to={backTo}
      >
        <span aria-hidden="true" className="text-xl leading-none">←</span> {backLabel}
      </Link>
      <BrandPageIntro description={description} eyebrow={eyebrow} logo title={title} />
      <section aria-label="Tổng quan kết quả" className={`grid gap-3 sm:grid-cols-2 ${stats.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
        {stats.map((stat) => (
          <div className={`rounded-2xl border p-5 shadow-sm ${stat.primary ? 'border-ice-navy bg-ice-navy text-white' : 'border-slate-200 bg-white text-ice-navy'}`} key={stat.label}>
            <p className={`text-sm font-semibold ${stat.primary ? 'text-white/75' : 'text-slate-500'}`}>{stat.label}</p>
            <p className={`mt-3 text-3xl font-extrabold tabular-nums ${stat.primary ? 'text-ice-gold' : stat.valueClass || 'text-ice-navy'}`}>{stat.value}</p>
            {stat.caption && <p className={`mt-1 text-xs ${stat.primary ? 'text-white/75' : 'text-slate-500'}`}>{stat.caption}</p>}
          </div>
        ))}
      </section>
    </>
  )
}
