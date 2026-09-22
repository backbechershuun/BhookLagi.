import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/* Shared layout for the Terms and Privacy pages.
   Put this file in src/components. */

export const LegalLink = ({ to, children }) => (
  <Link to={to} className="text-brand-600 underline underline-offset-2">
    {children}
  </Link>
);

const DOCS = [
  { key: "terms", to: "/terms", label: "Terms and conditions", short: "Terms" },
  { key: "privacy", to: "/privacy", label: "Privacy policy", short: "Privacy" },
];

const CheckIcon = ({ className = "h-4 w-4" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const TocList = ({ sections, activeId, onNavigate }) => (
  <ol className="border-l border-stone-200">
    {sections.map((s, i) => {
      const active = s.id === activeId;
      return (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            onClick={onNavigate(s.id)}
            aria-current={active ? "location" : undefined}
            className={`-ml-px block border-l-2 py-1.5 pl-4 text-sm transition-colors ${
              active
                ? "border-brand-600 font-medium text-brand-700"
                : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-800"
            }`}
          >
            <span className="mr-1.5 tabular-nums text-stone-400">{i + 1}.</span>
            {s.title}
          </a>
        </li>
      );
    })}
  </ol>
);

const Block = ({ block }) => {
  if (block.type === "ul") {
    return (
      <ul className="list-disc space-y-1.5 pl-5 marker:text-stone-400">
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }
  return <p>{block.content}</p>;
};

/**
 * Props:
 *  current      "terms" | "privacy"
 *  title        page heading
 *  intro        one line under the heading
 *  lastUpdated  string
 *  summary      string[] shown in "The short version"
 *  sections     [{ id, title, blocks: [{ type: "p", content } | { type: "ul", items }] }]
 */
const LegalPage = ({ current, title, intro, lastUpdated, summary, sections }) => {
  const [activeId, setActiveId] = useState(sections[0].id);
  const mobileTocRef = useRef(null);
  const other = DOCS.find((d) => d.key !== current);

  // Page title, and jump to a section if the URL has a hash (e.g. /terms#liability).
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const hash = window.location.hash.slice(1);
    const target = hash && document.getElementById(hash);
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);

    return () => {
      document.title = previousTitle;
    };
  }, [title]);

  // Highlight the section currently being read.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const goTo = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
    setActiveId(id);
    if (mobileTocRef.current) mobileTocRef.current.open = false;
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <header className="max-w-2xl">
        {/* switch between the two documents */}
        <nav
          aria-label="Legal documents"
          className="mb-6 inline-flex rounded-full bg-stone-100 p-1 text-sm print:hidden"
        >
          {DOCS.map((d) => {
            const active = d.key === current;
            return (
              <Link
                key={d.key}
                to={d.to}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-1.5 transition-colors ${
                  active ? "bg-white font-medium text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {d.short}
              </Link>
            );
          })}
        </nav>

        <h1 className="font-display text-4xl">{title}</h1>
        <p className="mt-3 text-stone-500">{intro}</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500 print:hidden">
          <span>Last updated {lastUpdated}</span>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-stone-300" />
          <button
            type="button"
            onClick={() => window.print()}
            className="text-brand-600 hover:underline focus:outline-none focus-visible:underline"
          >
            Print or save as PDF
          </button>
        </div>
      </header>

      <aside className="mt-10 max-w-2xl rounded-2xl border border-brand-600/20 bg-brand-50 p-5">
        <h2 className="text-sm font-semibold text-brand-700">The short version</h2>
        <ul className="mt-3 space-y-2">
          {summary.map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm text-stone-700">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-stone-500">
          This summary is only a convenience. The full text below is what applies.
        </p>
      </aside>

      <details
        ref={mobileTocRef}
        className="mt-8 rounded-xl border border-stone-200 px-4 py-3 lg:hidden print:hidden"
      >
        <summary className="cursor-pointer text-sm font-medium text-stone-700">On this page</summary>
        <div className="mt-3">
          <TocList sections={sections} activeId={activeId} onNavigate={goTo} />
        </div>
      </details>

      <div className="mt-12 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14">
        <aside className="hidden lg:block print:hidden">
          <nav aria-label={`${title} sections`} className="sticky top-24">
            <p className="mb-3 text-sm font-medium text-stone-700">On this page</p>
            <TocList sections={sections} activeId={activeId} onNavigate={goTo} />
          </nav>
        </aside>

        <article className="max-w-2xl space-y-12">
          {sections.map((section, i) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="font-display text-xl text-stone-900 mb-3">
                <span className="mr-2 tabular-nums text-stone-400">{i + 1}.</span>
                {section.title}
              </h2>
              <div className="space-y-3 text-[15px] leading-7 text-stone-600">
                {section.blocks.map((block, j) => (
                  <Block key={j} block={block} />
                ))}
              </div>
            </section>
          ))}

          <div className="rounded-2xl bg-stone-50 p-6 print:hidden">
            <p className="font-medium text-stone-800">Ready to get started?</p>
            <p className="mt-1 text-sm text-stone-500">
              Creating an account means you agree to our terms and privacy policy.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                Back to sign up
              </Link>
              <Link
                to={other.to}
                className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400"
              >
                Read the {other.label.toLowerCase()}
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default LegalPage;