"use client";

import { useRef, useState } from "react";
import Link from "next/link";

export default function Footer({
  siteMeta = { name: "Nexus Inventory", logoUrl: null, tagline: "Inventory management that scales" },
  navGroups = [
    {
      title: "Product",
      links: [
        { label: "Products", href: "/products" },
        { label: "Inventory", href: "/inventory" },
        { label: "Pricing", href: "/pricing" },
        { label: "Demo", href: "/demo" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Blog", href: "/blog" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Docs", href: "/docs" },
        { label: "API", href: "/api" },
        { label: "Tutorials", href: "/tutorials" },
        { label: "Status", href: "/status" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Contact", href: "/contact" },
        { label: "Help Center", href: "/help" },
        { label: "Community", href: "/community" },
      ],
    },
  ],
  contact = { email: null, phone: null, supportUrl: null },
  social = [],
  legalLinks = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
  ],
  buildInfo = null,
  localeOptions = null,
  newsletterAction = null,
  isAuthenticated = false,
}) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState(null);
  const liveRef = useRef(null);

  function onNewsletterSubmit(e) {
    e?.preventDefault();
    if (!newsletterAction) {
      setNewsletterStatus("subscribe-link");
      liveRef.current?.focus();
      return;
    }
    if (typeof newsletterAction === "string") {
      fetch(newsletterAction, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: newsletterEmail }) })
        .then((r) => {
          if (r.ok) setNewsletterStatus("subscribed");
          else setNewsletterStatus("error");
          liveRef.current?.focus();
        })
        .catch(() => {
          setNewsletterStatus("error");
          liveRef.current?.focus();
        });
    } else if (typeof newsletterAction === "function") {
      Promise.resolve(newsletterAction(newsletterEmail))
        .then(() => {
          setNewsletterStatus("subscribed");
          liveRef.current?.focus();
        })
        .catch(() => {
          setNewsletterStatus("error");
          liveRef.current?.focus();
        });
    }
  }

  function backToTop() {
    const main = document.getElementById("content") || document.querySelector("main") || document.body;
    main.scrollIntoView({ behavior: "smooth" });
    const first = main.querySelector("a,button,input,select,textarea,h1,h2,h3,p");
    first?.focus();
  }

  return (
    <footer role="contentinfo" className="site-footer bg-gray-50 text-gray-700 p-6 md:p-8">
      <div className="footer-top flex gap-6 flex-wrap justify-between">
        {/* Left / Brand area */}
        <div className="footer-brand w-48">
          <Link href="/" aria-label={`${siteMeta.name} home`} className="inline-flex items-center gap-3">
            {siteMeta.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={siteMeta.logoUrl} alt={`${siteMeta.name} logo`} className="h-8" />
            ) : (
              <strong className="text-lg text-gray-900">{siteMeta.name}</strong>
            )}
          </Link>
          <div className="tagline text-xs text-gray-600 mt-1">{siteMeta.tagline}</div>
        </div>

        {/* Center / Primary links */}
        <div className="footer-links flex gap-8 flex-1 flex-wrap">
          {navGroups.map((group) => (
            <div key={group.title} className="footer-group w-40">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">{group.title}</h4>
              <ul className="list-none p-0 m-0 space-y-2 text-sm text-gray-600">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="hover:text-gray-900">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Right / Utilities & meta */}
        <div className="footer-utils w-56">
          <div className="contact">
            <div className="text-sm font-medium text-gray-800">Contact</div>
            <div className="mt-1">
              {contact.supportUrl ? (
                <a href={contact.supportUrl} className="text-sm text-indigo-600 hover:underline">
                  Contact support
                </a>
              ) : contact.email ? (
                <a href={`mailto:${contact.email}`} className="text-sm text-gray-700 hover:underline">
                  {contact.email}
                </a>
              ) : (
                <div className="text-sm text-gray-500">Support: —</div>
              )}
            </div>
            {contact.phone ? (
              <div className="mt-1 text-sm">
                <a href={`tel:${contact.phone}`} className="text-gray-700 hover:underline">
                  {contact.phone}
                </a>
              </div>
            ) : null}
          </div>

          {social?.length > 0 && (
            <div className="social mt-3 flex flex-wrap">
              {social.map((s) => (
                <a
                  key={s.provider}
                  href={s.href}
                  aria-label={s.provider}
                  className="mr-3 text-sm text-indigo-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.provider}
                </a>
              ))}
            </div>
          )}

          <div className="newsletter mt-4">
            {!isAuthenticated ? (
              newsletterAction ? (
                <form onSubmit={onNewsletterSubmit} className="flex items-center gap-2">
                  <label htmlFor="footer-newsletter" className="sr-only">
                    Email for newsletter
                  </label>
                  <input
                    id="footer-newsletter"
                    type="email"
                    placeholder="Email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="border rounded px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button type="submit" className="bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700">
                    Subscribe
                  </button>
                </form>
              ) : (
                <Link href="/subscribe" className="text-sm text-indigo-600 hover:underline">
                  Subscribe to our newsletter
                </Link>
              )
            ) : (
              <div className="text-sm">
                <Link href="/account" className="text-indigo-600 hover:underline">
                  Manage subscription
                </Link>
                <div className="mt-1">
                  <Link href="/settings" className="text-gray-700 hover:underline">
                    Account settings
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legal strip */}
      <div className="footer-bottom flex justify-between items-center mt-6 border-t border-gray-200 pt-4">
        <div className="legal">
          <div className="text-sm text-gray-600">© {new Date().getFullYear()} {siteMeta.name}</div>
          <div className="flex gap-4 mt-2 text-sm">
            {legalLinks.map((l) => (
              <span key={l.href}>
                <Link href={l.href} className="text-gray-600 hover:underline">
                  {l.label}
                </Link>
              </span>
            ))}
          </div>
        </div>

        <div className="meta text-xs text-gray-500 text-right">
          {buildInfo ? (
            <div>
              <span>{buildInfo.version ? `v${buildInfo.version}` : null}</span>
              {buildInfo.commit ? <span className="ml-2">commit {buildInfo.commit.slice(0, 7)}</span> : null}
              {buildInfo.environment ? <span className="ml-2">env: {buildInfo.environment}</span> : null}
            </div>
          ) : null}

          <div className="mt-2">
            <button onClick={backToTop} aria-label="Back to top" className="text-indigo-600 hover:underline text-sm">
              Back to top
            </button>
          </div>
        </div>
      </div>

      {/* Live region for status messages */}
      <div tabIndex={-1} ref={liveRef} aria-live="polite" className="sr-only">
        {newsletterStatus === "subscribed"
          ? "Subscribed to newsletter"
          : newsletterStatus === "error"
          ? "Failed to subscribe"
          : newsletterStatus === "subscribe-link"
          ? "Open subscribe page"
          : ""}
      </div>
    </footer>
  );
}
