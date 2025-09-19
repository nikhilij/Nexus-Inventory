"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthProvider from "@/components/AuthProvider";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

function LayoutContent({ children }) {
   const { data: session, status } = useSession();
   const pathname = usePathname();

   // Check if user is on authenticated pages
   const isAuthenticatedPage = [
      "/dashboard",
      "/products",
      "/inventory",
      "/orders",
      "/suppliers",
      "/reports",
      "/settings",
   ].includes(pathname);

   // Show footer only for non-authenticated users or public pages
   const showFooter = !session || !isAuthenticatedPage;

   return (
      <>
         <Header />
         <main id="content">{children}</main>
         {showFooter && <Footer />}
      </>
   );
}

export default function ClientLayout({ children }) {
   return (
      <AuthProvider>
         <LayoutContent>{children}</LayoutContent>
      </AuthProvider>
   );
}
