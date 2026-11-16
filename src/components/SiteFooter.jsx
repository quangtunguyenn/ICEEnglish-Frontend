import { Link } from "react-router-dom";
import { scrollCurrentPageLinkToTop } from "../utils/navigationScroll";

const currentYear = new Date().getFullYear();

// Điền thông tin chính thức tại đây khi ICE công bố.
const CONTACT = { phone: "", email: "" };
const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "",
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
  {
    name: "TikTok",
    href: "",
    path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  },
];

const NAV_GROUPS = [
  {
    title: "Khám phá ICE",
    links: [
      { to: "/ve-chung-toi", label: "Về chúng tôi" },
      { to: "/khoa-hoc/ice-masterclass", label: "ICE Masterclass" },
      { to: "/vinh-danh", label: "Vinh danh học sinh" },
    ],
  },
  {
    title: "Phòng thi",
    links: [
      { to: "/luyen-de", label: "Luyện đề chuyên sâu" },
      { to: "/thi-thu", label: "Thi thử mô phỏng" },
    ],
  },
  {
    title: "Học tập",
    links: [
      { to: "/video", label: "Bài giảng video" },
      { to: "/tu-vung", label: "Luyện từ vựng" },
      { to: "/doc-hieu", label: "Thư viện đọc hiểu" },
    ],
  },
];

const ICONS = {
  arrow: "M14 5l7 7m0 0l-7 7m7-7H3",
  up: "M5 15l7-7 7 7",
  mail: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  phone: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ice-gold";

function Icon({ name, className = "h-5 w-5" }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d={ICONS[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SocialLink({ social }) {
  const icon = (
    <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24">
      <path d={social.path} />
    </svg>
  );
  const classes = "inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white";

  return social.href ? (
    <a
      aria-label={`${social.name} của ICE English (mở tab mới)`}
      className={`${classes} transition-colors hover:border-ice-gold hover:text-ice-gold ${focusRing}`}
      href={social.href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {icon}
    </a>
  ) : (
    <span aria-label={`${social.name}: chưa cập nhật liên kết`} className={`${classes} text-slate-400`} role="img">
      {icon}
    </span>
  );
}

function ContactItem({ icon, label, value, href }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ice-gold/20 bg-ice-gold/[0.08] text-ice-gold">
        <Icon className="h-[18px] w-[18px]" name={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-300">{label}</p>
        {value ? (
          <a className={`mt-1 block break-all text-sm font-medium text-white transition-colors hover:text-ice-gold ${focusRing}`} href={href}>
            {value}
          </a>
        ) : (
          <p className="mt-1 text-sm text-slate-400">Chưa cập nhật</p>
        )}
      </div>
    </li>
  );
}

export function SiteFooter() {
  return (
    <footer
      className="relative mt-20 overflow-hidden bg-[#07152e] font-inter text-slate-300 selection:bg-ice-gold/30 selection:text-white"
      onClickCapture={scrollCurrentPageLinkToTop}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#1c447b]/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-ice-gold/[0.07] blur-3xl" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ice-gold/70 to-transparent" />
      <img alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-20 hidden w-[440px] opacity-[0.035] grayscale invert md:block" src="/ice_english_emblem_vector.svg" />

      <div className="relative mx-auto w-full max-w-[1400px] px-6 sm:px-8 lg:flex lg:min-h-svh lg:flex-col lg:justify-between lg:px-12">
        <div className="flex flex-col gap-7 border-b border-white/10 py-12 md:flex-row md:items-end md:justify-between md:py-14 lg:py-6">
          <div className="max-w-2xl">
            <p className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-ice-gold">
              <span aria-hidden="true" className="h-px w-8 bg-ice-gold" />
              Cùng ICE tiến bộ mỗi ngày
            </p>
            <h2 className="font-gf text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
              Vững vàng từng bước,<br />
              <span className="text-ice-gold">sẵn sàng cho kỳ thi.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
              Từ bài giảng đến phòng thi ảo, ICE đồng hành cùng bạn trên hành trình chuẩn bị kiến thức và sự tự tin.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className={`group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-ice-gold px-6 py-3 text-sm font-bold text-[#102B5C] transition-colors hover:bg-white ${focusRing}`} to="/thi-thu">
              Trải nghiệm phòng thi
              <Icon className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" name="arrow" />
            </Link>
            <Link className={`inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-ice-gold hover:text-ice-gold ${focusRing}`} to="/video">
              Xem bài giảng
            </Link>
          </div>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:py-6">
          <div className="sm:col-span-2 lg:col-span-4 lg:pr-8">
            <Link aria-label="ICE English - Trang chủ" className={`inline-flex w-fit rounded-xl bg-white px-4 py-3 ${focusRing}`} to="/">
              <img alt="ICE English" className="h-8 w-auto" src="/logo.png" />
            </Link>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.13em] text-ice-gold lg:mt-3">Innovative · Creative · Effective</p>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300 lg:mt-3 lg:leading-6">
              Lấy học sinh làm trung tâm, ICE English đồng hành cùng các bạn trên hành trình chinh phục kỳ thi THPT.
            </p>
            <div className="mt-6 lg:mt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">Kết nối cùng ICE</p>
              <ul aria-label="Mạng xã hội" className="flex items-center gap-3">
                {SOCIAL_LINKS.map((social) => <li key={social.name}><SocialLink social={social} /></li>)}
              </ul>
              {SOCIAL_LINKS.some((social) => !social.href) && (
                <p className="mt-3 text-xs leading-5 text-slate-400 lg:mt-2">Liên kết mạng xã hội đang cập nhật.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:col-span-2 sm:grid-cols-3 lg:col-span-5">
            {NAV_GROUPS.map((group) => (
              <nav aria-label={group.title} key={group.title}>
                <h3 className="mb-5 text-sm font-bold text-white">{group.title}</h3>
                <ul className="flex flex-col gap-3">
                  {group.links.map((link) => (
                    <li key={link.to}>
                      <Link className={`inline-block rounded text-sm leading-6 text-slate-300 transition-colors hover:text-ice-gold ${focusRing}`} to={link.to}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <h3 className="mb-5 text-sm font-bold text-white">Liên hệ</h3>
            <ul className="flex flex-col gap-5">
              <ContactItem icon="phone" label="Số điện thoại" value={CONTACT.phone} href={`tel:${CONTACT.phone.replace(/\s+/g, "")}`} />
              <ContactItem icon="mail" label="Email / Gmail" value={CONTACT.email} href={`mailto:${CONTACT.email}`} />
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:py-4">
          <p>© {currentYear} ICE English. All rights reserved.</p>
          <button
            aria-label="Lên đầu trang"
            className={`group inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-ice-gold hover:text-ice-gold ${focusRing}`}
            onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
            type="button"
          >
            Lên đầu trang
            <Icon className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none" name="up" />
          </button>
        </div>
      </div>
    </footer>
  );
}
