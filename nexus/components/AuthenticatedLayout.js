"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { FiMenu, FiSearch, FiBell } from "react-icons/fi";

export default function AuthenticatedLayout({ children }) {
   const { data: session, status } = useSession();
   const router = useRouter();
   const [sidebarOpen, setSidebarOpen] = useState(false);

   useEffect(() => {
      if (status === "loading") return; // Still loading
      if (!session) {
         router.push("/login");
      }
   }, [session, status, router]);

   if (status === "loading") {
      return (
         <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
         </div>
      );
   }

   if (!session) {
      return null; // Will redirect to login
   }

   return (
      <div className="min-h-screen bg-gray-50 flex">
         {/* Sidebar */}
         <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            onClose={() => setSidebarOpen(false)}
         />

         {/* Main Content */}
         <div className="flex-1 flex flex-col lg:pl-64">
            {/* Top Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 lg:px-6">
               <div className="flex items-center justify-between">
                  {/* Mobile menu button */}
                  <button
                     onClick={() => setSidebarOpen(true)}
                     className="p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
                     aria-label="Open sidebar"
                  >
                     <FiMenu size={20} />
                  </button>

                  {/* Desktop spacer (visible at lg) */}
                  <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">{/* Spacer for desktop sidebar */}</div>

                  {/* Right side actions */}
                  <div className="flex items-center gap-4 ml-auto">
                     {/* Search */}
                     <button className="p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                        <FiSearch size={20} />
                     </button>

                     {/* Notifications */}
                     <button className="p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 relative">
                        <FiBell size={20} />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                           3
                        </span>
                     </button>

                     {/* User menu */}
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                           {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <span className="hidden md:block text-sm font-medium text-gray-700">
                           {session.user?.name || "User"}
                        </span>
                     </div>
                  </div>
               </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-auto">
               <div className="p-4 lg:p-6">{children}</div>
            </main>
         </div>
      </div>
   );
}
