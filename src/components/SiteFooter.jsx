import { Link } from "react-router-dom";
import { scrollCurrentPageLinkToTop } from "../utils/navigationScroll";

const currentYear = new Date().getFullYear();

/* ═══════════════ Cấu hình nội dung: chỉnh tại đây, không cần sửa JSX ═══════════════ */

// Điền đường dẫn thật vào href. Mục nào để trống sẽ tự ẩn, tránh liên kết chết.
const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "",
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
  {
    name: "YouTube",
    href: "",
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    name: "TikTok",
    href: "",
    path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  },
];

// Điền thông tin liên hệ thật. Để trống thì cột "Liên hệ" tự ẩn.
const CONTACT = { email: "", phone: "", address: "" };

// Cần có route tương ứng trong router (hoặc đổi đường dẫn cho khớp).
const LEGAL_LINKS = [
  { label: "Điều khoản", to: "/dieu-khoan" },
  { label: "Bảo mật", to: "/bao-mat" },
];

const NAV_GROUPS = [
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

const VALUE_PROPS = [
  { icon: "route", title: "Lộ trình cá nhân hóa", text: "Học theo mục tiêu và nhịp độ của riêng bạn." },
  { icon: "clipboard", title: "Luyện đề và thi thử", text: "Làm bài, xem đáp án chi tiết và xem lại bài đã làm." },
  { icon: "play", title: "Bài giảng video bài bản", text: "Video kèm tài liệu, từ vựng và bài tập về nhà." },
  { icon: "book", title: "Từ vựng và đọc hiểu", text: "Thẻ ghi nhớ, trắc nghiệm và thư viện bài đọc." },
];

const ICONS = {
  route: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  play: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  book: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  arrow: "M14 5l7 7m0 0l-7 7m7-7H3",
  up: "M5 15l7-7 7 7",
  mail: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  phone: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  pin: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
};

// Hạt nhiễu tạo bằng SVG nội tuyến: không phụ thuộc dịch vụ bên ngoài.
const NOISE_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>";
const NOISE = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`;

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const scrollToTop = () => window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" });

const ring =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1a]";

function Icon({ name, className = "h-5 w-5" }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d={ICONS[name]} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SiteFooter() {
  const socials = SOCIAL_LINKS.filter((item) => item.href);
  const hasContact = Boolean(CONTACT.email || CONTACT.phone || CONTACT.address);

  return (
    <footer
      className="relative mt-20 flex flex-col overflow-hidden bg-[#07152e] font-inter text-slate-300 selection:bg-ice-gold/30 selection:text-white lg:min-h-svh"
      onClickCapture={scrollCurrentPageLinkToTop}
    >
      {/* Nền: đường viền vàng, quầng sáng navy và vàng, hạt nhiễu, biểu tượng thương hiệu mờ */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ice-gold/70 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-[#102B5C]/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-ice-gold/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: NOISE }} />
      <img
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-16 hidden w-[460px] opacity-[0.045] grayscale invert md:block"
        src="/ice_english_emblem_vector.svg"
      />

      <div className="relative mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-between px-6 pt-12 sm:px-8 lg:px-12 lg:pt-5">
        {/* 1. Lời kêu gọi hành động */}
        <div className="flex flex-col items-start justify-between gap-8 pb-10 lg:flex-row lg:items-end lg:pb-4">
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-3 text-sm font-semibold text-ice-gold">
              <span aria-hidden="true" className="h-px w-8 bg-ice-gold" />
              Cùng ICE tiến bộ mỗi ngày
            </p>
            <h2 className="text-3xl font-bold leading-[1.1] tracking-tight text-white md:text-4xl lg:text-[2rem] xl:text-[2.4rem]">
              Sẵn sàng chinh phục <br />
              <span className="bg-gradient-to-r from-ice-gold-300 to-ice-gold bg-clip-text text-transparent">
                mục tiêu tiếp theo?
              </span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
              Luyện đề, xem bài giảng và ôn từ vựng trong cùng một nơi, mọi lúc bạn cần.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/luyen-de"
              className={`group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-white px-6 py-3 text-sm font-bold text-[#050d1a] shadow-lg shadow-black/30 transition-transform duration-300 hover:scale-[1.03] active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 ${ring}`}
            >
              <span className="relative z-10">Bắt đầu hành trình</span>
              <Icon className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" name="arrow" />
              <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-ice-gold transition-transform duration-500 ease-out group-hover:translate-x-0 motion-reduce:transition-none" />
            </Link>
            <Link
              to="/video"
              className={`inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:border-ice-gold hover:text-ice-gold ${ring}`}
            >
              Xem bài giảng
            </Link>
          </div>
        </div>

        {/* 2. Giá trị cốt lõi */}
        <ul className="grid gap-3 border-y border-white/10 py-6 sm:grid-cols-2 lg:grid-cols-4 lg:py-3">
          {VALUE_PROPS.map((item) => (
            <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 lg:gap-2 lg:p-3" key={item.title}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ice-gold/10 text-ice-gold ring-1 ring-ice-gold/20 lg:h-8 lg:w-8">
                <Icon name={item.icon} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-300 lg:leading-4">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* 3. Thương hiệu và điều hướng */}
        <div className="grid gap-10 py-10 lg:grid-cols-12 lg:gap-8 lg:py-4">
          <div className="flex flex-col gap-4 lg:col-span-5 lg:gap-3 lg:pr-12">
            <Link
              to="/"
              aria-label="ICE English - Trang chủ"
              className={`inline-block w-fit rounded-2xl bg-white px-4 py-3 shadow-lg shadow-black/30 ring-1 ring-white/20 transition-transform duration-300 hover:-translate-y-0.5 active:scale-95 motion-reduce:transition-none ${ring}`}
            >
              <img alt="ICE English" className="h-8 w-auto" src="/logo.png" />
            </Link>

            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-white">
              Innovative
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-ice-gold" />
              Creative
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-ice-gold" />
              Effective
            </p>

            <p className="max-w-md text-sm leading-relaxed text-slate-300">
              Đồng hành cùng bạn học tiếng Anh, luyện tập và tiến gần hơn đến mục tiêu.
            </p>

            {socials.length > 0 && (
              <ul aria-label="Mạng xã hội" className="flex items-center gap-3">
                {socials.map((social) => (
                  <li key={social.name}>
                    <a
                      aria-label={`${social.name} của ICE English (mở tab mới)`}
                      className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:-translate-y-1 hover:border-ice-gold hover:bg-ice-gold/10 hover:text-ice-gold motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${ring}`}
                      href={social.href}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24">
                        <path d={social.path} />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`grid grid-cols-2 gap-10 sm:gap-14 lg:col-span-7 lg:pl-8 ${hasContact ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
            {NAV_GROUPS.map((group) => (
              <nav aria-label={group.title} key={group.title}>
                <FooterHeading>{group.title}</FooterHeading>
                <ul className="flex flex-col gap-2.5">
                  {group.links.map((link) => (
                    <FooterLink key={link.to} to={link.to}>{link.label}</FooterLink>
                  ))}
                </ul>
              </nav>
            ))}

            {hasContact && (
              <div className="col-span-2 lg:col-span-1">
                <FooterHeading>Liên hệ</FooterHeading>
                <ul className="flex flex-col gap-4 text-[15px] text-slate-400">
                  {CONTACT.email && (
                    <li>
                      <a className={`flex items-start gap-3 rounded transition-colors hover:text-white ${ring}`} href={`mailto:${CONTACT.email}`}>
                        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ice-gold" name="mail" />
                        <span className="break-all">{CONTACT.email}</span>
                      </a>
                    </li>
                  )}
                  {CONTACT.phone && (
                    <li>
                      <a className={`flex items-start gap-3 rounded transition-colors hover:text-white ${ring}`} href={`tel:${CONTACT.phone.replace(/\s+/g, "")}`}>
                        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ice-gold" name="phone" />
                        {CONTACT.phone}
                      </a>
                    </li>
                  )}
                  {CONTACT.address && (
                    <li className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ice-gold" name="pin" />
                      {CONTACT.address}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 4. Thanh bản quyền */}
        <div className="flex flex-col gap-5 border-t border-white/10 py-5 text-sm text-slate-300 md:flex-row md:items-center md:justify-between lg:py-2">
          <p>© {currentYear} ICE English. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <nav aria-label="Pháp lý" className="flex items-center gap-6">
              {LEGAL_LINKS.map((item) => (
                <Link className={`rounded transition-colors hover:text-white ${ring}`} key={item.to} to={item.to}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <button
              aria-label="Lên đầu trang"
              className={`group inline-flex items-center gap-2 rounded-full border border-white/10 py-2 pl-4 pr-3 font-medium text-slate-300 transition-colors duration-300 hover:border-ice-gold hover:text-ice-gold ${ring}`}
              onClick={scrollToTop}
              type="button"
            >
              Lên đầu trang
              <Icon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transition-none" name="up" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }) {
  return (
    <>
      <h3 className="text-sm font-semibold text-white">{children}</h3>
      <span aria-hidden="true" className="mb-4 mt-2 block h-0.5 w-6 rounded-full bg-ice-gold" />
    </>
  );
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link
        to={to}
        className="group flex w-fit items-center gap-2 rounded text-[15px] font-medium text-slate-400 outline-none transition-colors duration-300 hover:text-white focus-visible:text-white focus-visible:ring-2 focus-visible:ring-ice-gold"
      >
        <span aria-hidden="true" className="h-[2px] w-0 bg-ice-gold transition-all duration-300 ease-out group-hover:w-4 group-focus-visible:w-4 motion-reduce:transition-none" />
        <span className="transition-transform duration-300 ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
          {children}
        </span>
      </Link>
    </li>
  );
}