import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { label: "Find a restaurant", to: "/restaurants" },
    ],
    Company: [
      { label: "About us", to: "/about" },
      { label: "Careers", to: "/careers" },
      { label: "Blog", to: "/blog" },
      { label: "Contact", to: "/contact" },
    ],
    Support: [
      { label: "Help center", to: "/help" },
      { label: "Cancellation policy", to: "/cancellation-policy" },
      { label: "Terms of service", to: "/terms" },
      { label: "Privacy policy", to: "/privacy" },
    ],
  };

  const socials = [
    {
      label: "Instagram",
      href: "https://instagram.com",
      icon: "M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm5.1-2.6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z",
    },
    {
      label: "Twitter",
      href: "https://twitter.com",
      icon: "M22 5.9c-.7.3-1.5.5-2.3.6.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.6 11.6 0 0 1 3.4 4.6a4.1 4.1 0 0 0 1.3 5.5c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.6 3.3 4a4.1 4.1 0 0 1-1.9.1 4.1 4.1 0 0 0 3.8 2.9A8.2 8.2 0 0 1 2 18.4a11.6 11.6 0 0 0 6.3 1.9c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.2z",
    },
    {
      label: "Facebook",
      href: "https://facebook.com",
      icon: "M13.5 22v-8.5H16l.5-3.5h-3V7.8c0-1 .3-1.7 1.7-1.7H16.5V3.1C16.2 3 15.2 3 14 3c-2.5 0-4.3 1.5-4.3 4.4v2.6H7v3.5h2.7V22h3.8z",
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-stone-200">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/footer-texture.png')" }}
      />
      {/* Gradient overlay on top of the image */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-50/95 via-stone-50/90 to-stone-50/98" />

      {/* Content sits above both layers */}
      <div className="relative max-w-6xl mx-auto px-6">
        {/* Link columns */}
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 pt-16 pb-14">
          <div>
            {/* Logo — same image as the navbar, clickable to go home */}
            <Link to="/" aria-label="BhookLagi home" className="inline-block">
              <img
                src="/Bhooklagi.png"
                alt="BhookLagi"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-stone-500 max-w-xs">
              Find a restaurant, pick your exact table, and reserve it in
              seconds. No calls, no waiting.
            </p>
            <div className="flex gap-3 mt-6">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-stone-200 text-stone-500 hover:border-brand-600 hover:text-brand-600 hover:-translate-y-0.5 transition"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d={s.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-stone-900 font-medium text-sm mb-4 tracking-wide">
                {section}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-stone-500 hover:text-brand-600 transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t border-stone-200">
          <p className="text-xs text-stone-400">
            © {year} BhookLagi. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-stone-400">
            <Link to="/terms" className="hover:text-brand-600 transition">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-brand-600 transition">
              Privacy
            </Link>
            <Link to="/sitemap" className="hover:text-brand-600 transition">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;