"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FiMail, FiPhone, FiHelpCircle, FiArrowUp, FiTwitter, FiGithub, FiLinkedin } from "react-icons/fi";
import Image from "next/image";

export default function Footer({
   siteMeta = { name: "Nexus Inventory", logoUrl: null, tagline: "Inventory management that scales" },
   navGroups = [
      {
         title: "Product",
         links: [
            { label: "Platform", href: "/platform", public: true },
            { label: "Pricing", href: "/pricing", public: true },
            { label: "Demo", href: "/demo", public: true },
            { label: "Integrations", href: "/integrations", public: true },
         ],
      },
      {
         title: "Company",
         links: [
            { label: "About Us", href: "/about", public: true },
            { label: "Careers", href: "/careers", public: true },
            { label: "Blog", href: "/blog", public: true },
            { label: "Contact Us", href: "/contact", public: true },
         ],
      },
      {
         title: "Resources",
         links: [
            { label: "Documentation", href: "/docs", public: true },
            { label: "API Reference", href: "/api", public: true },
            { label: "Tutorials", href: "/tutorials", public: true },
            { label: "Status", href: "/status", public: true },
         ],
      },
      {
         title: "Legal",
         links: [
            { label: "Privacy Policy", href: "/privacy", public: true },
            { label: "Terms of Service", href: "/terms", public: true },
            { label: "Cookie Policy", href: "/cookies", public: true },
         ],
      },
   ],
   contact = { email: "support@nexus.com", phone: "+1 (555) 123-4567", supportUrl: "/help" },
   social = [
      { provider: "Twitter", href: "https://twitter.com/nexus", icon: <FiTwitter /> },
      { provider: "GitHub", href: "https://github.com/nexus", icon: <FiGithub /> },
      { provider: "LinkedIn", href: "https://linkedin.com/company/nexus", icon: <FiLinkedin /> },
   ],
   buildInfo = { version: "1.0.0", commit: "a1b2c3d", environment: "Production" },
   newsletterAction = async (email) => {
      console.log(`Subscribing ${email}`);
      return true;
   },
}) {
   const { status } = useSession();
   const isAuthenticated = status === "authenticated";
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
      setNewsletterStatus("loading");
      if (typeof newsletterAction === "string") {
         fetch(newsletterAction, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: newsletterEmail }),
         })
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
      window.scrollTo({ top: 0, behavior: "smooth" });
      const firstFocusable = document.querySelector("a,button,input,select,textarea,h1,h2,h3,p");
      firstFocusable?.focus();
   }

   return (
      <footer role="contentinfo" className="bg-gray-900 text-gray-300">
         <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               <div className="col-span-1 md:col-span-2 lg:col-span-1">
                  <Link
                     href={isAuthenticated ? "/dashboard" : "/"}
                     aria-label={`${siteMeta.name} home`}
                     className="flex items-center gap-2 mb-4"
                  >
                     {siteMeta.logoUrl ? (
                        <Image
                           src={siteMeta.logoUrl}
                           alt={`${siteMeta.name} logo`}
                           width={32}
                           height={32}
                           className="rounded-full"
                        />
                     ) : (
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-lg text-white">
                           N
                        </div>
                     )}
                     <strong className="text-xl font-bold text-white">{siteMeta.name}</strong>
                  </Link>
                  <p className="text-sm text-gray-400">{siteMeta.tagline}</p>
                  <div className="mt-6">
                     <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Subscribe to our newsletter
                     </h4>
                     {!isAuthenticated ? (
                        newsletterAction ? (
                           <form onSubmit={onNewsletterSubmit} className="flex flex-col sm:flex-row gap-2">
                              <label htmlFor="footer-newsletter" className="sr-only">
                                 Email for newsletter
                              </label>
                              <input
                                 id="footer-newsletter"
                                 type="email"
                                 placeholder="Your email address"
                                 value={newsletterEmail}
                                 onChange={(e) => setNewsletterEmail(e.target.value)}
                                 className="bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                 required
                              />
                              <button
                                 type="submit"
                                 className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-500 transition-colors font-semibold whitespace-nowrap"
                              >
                                 {newsletterStatus === "loading" ? "Subscribing..." : "Subscribe"}
                              </button>
                           </form>
                        ) : (
                           <Link href="/subscribe" className="text-indigo-400 hover:underline">
                              Subscribe to our newsletter
                           </Link>
                        )
                     ) : (
                        <div className="text-sm">
                           <p>You are subscribed.</p>
                           <Link href="/account" className="text-indigo-400 hover:underline">
                              Manage your subscription
                           </Link>
                        </div>
                     )}
                     <div aria-live="polite" ref={liveRef} className="sr-only">
                        {newsletterStatus === "subscribed"
                           ? "Thank you for subscribing!"
                           : newsletterStatus === "error"
                             ? "Failed to subscribe. Please try again."
                             : ""}
                     </div>
                  </div>
               </div>

               {navGroups
                  .filter((group) => {
                     // Filter out groups that have only public links for authenticated users
                     if (isAuthenticated) {
                        return group.links.some((link) => !link.public);
                     }
                     return true;
                  })
                  .map((group) => (
                     <div key={group.title}>
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                           {group.title}
                        </h4>
                        <ul className="space-y-3">
                           {group.links
                              .filter((link) => {
                                 // Show public links only to non-authenticated users
                                 if (link.public && isAuthenticated) {
                                    return false;
                                 }
                                 return true;
                              })
                              .map((link) => (
                                 <li key={link.href + link.label}>
                                    <Link
                                       href={link.href}
                                       className="text-gray-300 hover:text-white hover:underline transition-colors"
                                    >
                                       {link.label}
                                    </Link>
                                 </li>
                              ))}
                        </ul>
                     </div>
                  ))}
            </div>

            <div className="mt-12 border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between">
               <div className="text-sm text-gray-400 text-center sm:text-left">
                  &copy; {new Date().getFullYear()} {siteMeta.name}. All rights reserved.
                  {buildInfo && (
                     <span className="hidden md:inline-block ml-4">
                        v{buildInfo.version} ({buildInfo.commit.slice(0, 7)}) - {buildInfo.environment}
                     </span>
                  )}
               </div>
               <div className="flex items-center gap-4 mt-6 sm:mt-0">
                  {social.map((s) => (
                     <a
                        key={s.provider}
                        href={s.href}
                        aria-label={s.provider}
                        className="text-gray-400 hover:text-white transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                     >
                        {s.icon}
                     </a>
                  ))}
                  <button
                     onClick={backToTop}
                     aria-label="Back to top"
                     className="p-2 rounded-full bg-gray-800 hover:bg-indigo-600 text-gray-400 hover:text-white transition-all"
                  >
                     <FiArrowUp size={20} />
                  </button>
               </div>
            </div>
         </div>
      </footer>
   );
}
