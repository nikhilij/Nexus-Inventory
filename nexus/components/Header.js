"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { FiMenu, FiSearch, FiBell, FiUser, FiPlus, FiHelpCircle, FiLogIn, FiUserPlus, FiX } from "react-icons/fi";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header({
   company = null,
   navItems = [
      // Public pages (shown only to non-authenticated users)
      { key: "about", label: "About", href: "/about", public: true },
      { key: "platform", label: "Platform", href: "/platform", public: true },
      { key: "services", label: "Services", href: "/services", public: true },
      { key: "contact", label: "Contact", href: "/contact", public: true },

      // Subscriber pages (shown only to authenticated users)
      { key: "dashboard", label: "Dashboard", href: "/dashboard", subscriber: true },
      { key: "products", label: "Products", href: "/products", subscriber: true },
      { key: "inventory", label: "Inventory", href: "/inventory", subscriber: true },
      { key: "orders", label: "Orders", href: "/orders", subscriber: true },
      { key: "suppliers", label: "Suppliers", href: "/suppliers", subscriber: true },
      { key: "reports", label: "Reports", href: "/reports", subscriber: true },
      { key: "settings", label: "Settings", href: "/settings", subscriber: true },
   ],
   unreadNotifications = 0,
   onOpenSidebar = () => {},
   onSearch = () => {},
   onQuickAction = () => {},
   onNavSelect = () => {},
   onSwitchCompany = () => {},
}) {
   const { data: session, status } = useSession();
   const pathname = usePathname();
   const isAuthenticated = status === "authenticated";
   const isLoading = status === "loading";
   const user = session?.user;
   const sessionCompany = session?.user?.company;
   const companyName = company?.name ?? sessionCompany?.name;
   const companyRegistered =
      company?.isRegistered ?? sessionCompany?.isRegistered ?? !!(company?.id ?? sessionCompany?.id);
   const [mobileOpen, setMobileOpen] = useState(false);
   const [notifOpen, setNotifOpen] = useState(false);
   const [userOpen, setUserOpen] = useState(false);
   const [query, setQuery] = useState("");
   const searchRef = useRef(null);
   const mobilePanelRef = useRef(null);
   const hamburgerRef = useRef(null);

   // Check if user is on authenticated pages (these use the sidebar layout)
   const isAuthenticatedPage = [
      "/dashboard",
      "/products",
      "/inventory",
      "/orders",
      "/suppliers",
      "/reports",
      "/settings",
   ].includes(pathname);

   useEffect(() => {
      if (!isAuthenticated) return;
      function onKey(e) {
         if (e.key === "/" && document.activeElement !== searchRef.current) {
            e.preventDefault();
            searchRef.current?.focus();
         }
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
   }, [isAuthenticated]);

   useEffect(() => {
      function onKey(e) {
         if (e.key === "Escape") {
            if (mobileOpen) {
               setMobileOpen(false);
               hamburgerRef.current?.focus();
            }
            if (notifOpen) setNotifOpen(false);
            if (userOpen) setUserOpen(false);
         }
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
   }, [mobileOpen, notifOpen, userOpen]);

   useEffect(() => {
      if (!mobileOpen || !mobilePanelRef.current) return;
      const panel = mobilePanelRef.current;
      const focusable = panel.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      function onKey(e) {
         if (e.key !== "Tab") return;
         if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
         } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
         }
      }
      panel.addEventListener("keydown", onKey);
      first?.focus();
      return () => panel.removeEventListener("keydown", onKey);
   }, [mobileOpen]);

   function submitSearch(e) {
      e?.preventDefault();
      if (query.trim() === "") return;
      onSearch(query.trim());
   }

   // If user is authenticated and on an authenticated page, don't show the header navigation
   if (isAuthenticated && isAuthenticatedPage) {
      return null;
   }

   return (
      <header role="banner" className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
         <div className="container mx-auto flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
               <button
                  aria-label="Open menu"
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-nav"
                  onClick={() => {
                     setMobileOpen((v) => !v);
                     onOpenSidebar();
                  }}
                  ref={hamburgerRef}
                  className="p-2 text-gray-300 hover:text-white md:hidden cursor-pointer"
               >
                  {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
               </button>

               <Link href={isAuthenticated ? "/dashboard" : "/"} aria-label="Home" className="flex items-center gap-2">
                  {company?.logoUrl ? (
                     <Image src={company.logoUrl} alt="Nexus Logo" width={32} height={32} className="rounded-full" />
                  ) : (
                     <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                        N
                     </div>
                  )}
                  <strong className="text-xl font-bold hidden sm:inline">Nexus</strong>
               </Link>

               {isAuthenticated && companyName && companyRegistered && (
                  <div className="company-name text-sm text-gray-400 hidden lg:block">
                     {isLoading ? "Loading..." : companyName}
                  </div>
               )}
            </div>

            <nav role="navigation" aria-label="Primary" className="hidden md:flex items-center gap-2">
               {navItems
                  .filter((item) => {
                     // Show public pages only to non-authenticated users
                     if (item.public && isAuthenticated) {
                        return false;
                     }
                     // Show subscriber pages only to authenticated users (but not on authenticated pages)
                     if (item.subscriber && !isAuthenticated) {
                        return false;
                     }
                     // Show protected pages only to authenticated users (legacy support)
                     if (item.protected && !isAuthenticated) {
                        return false;
                     }
                     return true;
                  })
                  .map((item) => (
                     <Link
                        key={item.key}
                        href={item.href || "#"}
                        onClick={() => onNavSelect(item.key)}
                        className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                     >
                        {item.label}
                     </Link>
                  ))}
            </nav>

            <div className="flex items-center gap-4">
               {isAuthenticated && (
                  <form role="search" onSubmit={submitSearch} className="relative hidden lg:block">
                     <label htmlFor="header-search" className="sr-only">
                        Search
                     </label>
                     <input
                        id="header-search"
                        ref={searchRef}
                        type="search"
                        placeholder="Search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search"
                        className="bg-gray-800 border border-gray-700 rounded-full py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                     />
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="text-gray-400" />
                     </div>
                  </form>
               )}

               {isAuthenticated ? (
                  <>
                     <button
                        onClick={() => onQuickAction("create_item")}
                        aria-label="Create new item"
                        className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
                     >
                        <FiPlus size={20} />
                     </button>

                     <div className="relative">
                        <button
                           aria-label={`Notifications (${unreadNotifications})`}
                           aria-haspopup="true"
                           aria-expanded={notifOpen}
                           onClick={() => setNotifOpen((v) => !v)}
                           className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
                        >
                           <FiBell size={20} />
                           {unreadNotifications > 0 && (
                              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-gray-900" />
                           )}
                        </button>
                        {notifOpen && (
                           <div
                              role="dialog"
                              aria-label="Notifications"
                              className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 z-10"
                           >
                              <h3 className="font-bold text-lg mb-2">Notifications</h3>
                              <div className="text-gray-300">You have {unreadNotifications} unread notifications.</div>
                              <Link
                                 href="/notifications"
                                 className="block text-center mt-4 text-indigo-400 hover:underline"
                              >
                                 View all
                              </Link>
                           </div>
                        )}
                     </div>

                     <div className="relative">
                        <button
                           aria-haspopup="true"
                           aria-expanded={userOpen}
                           onClick={() => setUserOpen((v) => !v)}
                           aria-label="Open user menu"
                           className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                           {user?.image ? (
                              <Image
                                 src={user.image}
                                 alt="User Avatar"
                                 width={32}
                                 height={32}
                                 className="rounded-full"
                              />
                           ) : (
                              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                                 <FiUser className="text-gray-400" />
                              </div>
                           )}
                           <span className="hidden lg:inline text-sm font-medium">{user?.name}</span>
                        </button>
                        {userOpen && (
                           <div
                              role="menu"
                              className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 z-10"
                           >
                              <Link
                                 href="/account"
                                 role="menuitem"
                                 className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                              >
                                 Account
                              </Link>
                              <Link
                                 href="/profile"
                                 role="menuitem"
                                 className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                              >
                                 Profile
                              </Link>
                              <button
                                 onClick={() => onSwitchCompany("")}
                                 role="menuitem"
                                 className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                              >
                                 Switch Company
                              </button>
                              <div className="border-t border-gray-700 my-1"></div>
                              <button
                                 onClick={() => signOut()}
                                 role="menuitem"
                                 className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white cursor-pointer"
                              >
                                 Sign Out
                              </button>
                           </div>
                        )}
                     </div>
                  </>
               ) : (
                  <div className="flex items-center gap-2">
                     <Link
                        href="/docs"
                        aria-label="Help and documentation"
                        className="p-2 text-gray-300 hover:text-white hidden sm:block"
                     >
                        <FiHelpCircle size={20} />
                     </Link>
                     <Link
                        href="/login"
                        className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors"
                     >
                        <FiLogIn />
                        <span className="text-sm font-medium">Sign In</span>
                     </Link>
                     <Link
                        href="/signup"
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-500 transition-colors"
                     >
                        <FiUserPlus />
                        <span className="text-sm font-medium">Sign Up</span>
                     </Link>
                  </div>
               )}
            </div>
         </div>

         {mobileOpen && (
            <div
               id="mobile-nav"
               ref={mobilePanelRef}
               className="md:hidden bg-gray-900 border-t border-gray-800"
               role="dialog"
               aria-label="Mobile menu"
            >
               <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  {navItems
                     .filter((item) => {
                        // Show public pages only to non-authenticated users
                        if (item.public && isAuthenticated) {
                           return false;
                        }
                        // Show subscriber pages only to authenticated users (but not on authenticated pages)
                        if (item.subscriber && !isAuthenticated) {
                           return false;
                        }
                        // Show protected pages only to authenticated users (legacy support)
                        if (item.protected && !isAuthenticated) {
                           return false;
                        }
                        return true;
                     })
                     .map((item) => (
                        <Link
                           key={item.key}
                           href={item.href || "#"}
                           onClick={() => {
                              onNavSelect(item.key);
                              setMobileOpen(false);
                           }}
                           className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                        >
                           {item.label}
                        </Link>
                     ))}
               </div>
               {isAuthenticated && (
                  <div className="pt-4 pb-3 border-t border-gray-800">
                     <div className="flex items-center px-5">
                        <div className="flex-shrink-0">
                           {user?.image ? (
                              <Image
                                 src={user.image}
                                 alt="User Avatar"
                                 width={40}
                                 height={40}
                                 className="rounded-full"
                              />
                           ) : (
                              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                 <FiUser size={24} className="text-gray-400" />
                              </div>
                           )}
                        </div>
                        <div className="ml-3">
                           <div className="text-base font-medium text-white">{user?.name}</div>
                           <div className="text-sm font-medium text-gray-400">{user?.email}</div>
                        </div>
                     </div>
                     <div className="mt-3 px-2 space-y-1">
                        <Link
                           href="/account"
                           className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                           Account
                        </Link>
                        <Link
                           href="/profile"
                           className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                           Profile
                        </Link>
                        <button
                           onClick={() => signOut()}
                           className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-400 hover:text-white hover:bg-red-500 cursor-pointer"
                        >
                           Sign Out
                        </button>
                     </div>
                  </div>
               )}
            </div>
         )}
      </header>
   );
}
