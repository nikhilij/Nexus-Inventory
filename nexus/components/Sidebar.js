"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
   FiMenu,
   FiX,
   FiHome,
   FiPackage,
   FiDatabase,
   FiShoppingCart,
   FiTruck,
   FiBarChart,
   FiSettings,
   FiLogOut,
   FiUser,
   FiSearch,
   FiBell,
   FiChevronLeft,
   FiChevronRight,
} from "react-icons/fi";
import Image from "next/image";

const Sidebar = ({ isOpen, onToggle, onClose }) => {
   const { data: session } = useSession();
   const pathname = usePathname();
   const sidebarRef = useRef(null);

   // Close sidebar when clicking outside
   useEffect(() => {
      const handleClickOutside = (event) => {
         if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isOpen) {
            onClose();
         }
      };

      if (isOpen) {
         document.addEventListener("mousedown", handleClickOutside);
         // Prevent background scroll and avoid layout shift by compensating for scrollbar width
         const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
         document.body.style.overflow = "hidden";
         if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
      } else {
         document.body.style.overflow = "unset";
         document.body.style.paddingRight = "";
      }

      return () => {
         document.removeEventListener("mousedown", handleClickOutside);
         document.body.style.overflow = "unset";
         document.body.style.paddingRight = "";
      };
   }, [isOpen, onClose]);

   // Close sidebar on route change (mobile)
   useEffect(() => {
      if (window.innerWidth < 1024) {
         onClose();
      }
   }, [pathname, onClose]);

   const navigationItems = [
      { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: FiHome },
      { key: "products", label: "Products", href: "/products", icon: FiPackage },
      { key: "inventory", label: "Inventory", href: "/inventory", icon: FiDatabase },
      { key: "orders", label: "Orders", href: "/orders", icon: FiShoppingCart },
      { key: "suppliers", label: "Suppliers", href: "/suppliers", icon: FiTruck },
      { key: "reports", label: "Reports", href: "/reports", icon: FiBarChart },
      { key: "settings", label: "Settings", href: "/settings", icon: FiSettings },
   ];

   const isActive = (href) => {
      if (href === "/dashboard") {
         return pathname === "/dashboard";
      }
      return pathname.startsWith(href);
   };

   return (
      <>
         {/* Overlay for mobile */}
         {isOpen && (
            <div
               className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
               onClick={onClose}
            />
         )}

         {/* Sidebar */}
         <div
            ref={sidebarRef}
            className={`fixed left-0 top-0 h-full bg-gray-900 text-white z-50 transform transition-transform duration-300 ease-in-out ${
               isOpen ? "translate-x-0" : "-translate-x-full"
            } w-64 lg:translate-x-0`}
         >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
               <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                     N
                  </div>
                  <span className="text-xl font-bold">Nexus</span>
               </Link>

               {/* Close button for mobile */}
               <button
                  onClick={onClose}
                  className="p-2 rounded-md hover:bg-gray-800 transition-colors lg:hidden cursor-pointer"
                  aria-label="Close sidebar"
               >
                  <FiX size={20} />
               </button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-gray-800">
               <div className="flex items-center gap-3">
                  {session?.user?.image ? (
                     <Image
                        src={session.user.image}
                        alt="User Avatar"
                        width={40}
                        height={40}
                        className="rounded-full"
                     />
                  ) : (
                     <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <FiUser size={20} />
                     </div>
                  )}
                  <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium text-white truncate">{session?.user?.name || "User"}</p>
                     <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
                  </div>
               </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6">
               <ul className="space-y-2">
                  {navigationItems.map((item) => {
                     const Icon = item.icon;
                     const active = isActive(item.href);

                     return (
                        <li key={item.key}>
                           <Link
                              href={item.href}
                              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                 active
                                    ? "bg-indigo-600 text-white"
                                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                              }`}
                              onClick={() => window.innerWidth < 1024 && onClose()}
                           >
                              <Icon size={18} />
                              <span>{item.label}</span>
                              {active && <div className="ml-auto w-2 h-2 bg-white rounded-full" />}
                           </Link>
                        </li>
                     );
                  })}
               </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800">
               <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors cursor-pointer"
               >
                  <FiLogOut size={18} />
                  <span>Sign Out</span>
               </button>
            </div>
         </div>
      </>
   );
};

export default Sidebar;
