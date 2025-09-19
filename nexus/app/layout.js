import "@/app/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthProvider from "@/components/AuthProvider";

export const metadata = {
   title: "Nexus Inventory",
   description: "Inventory management system",
};

export default function RootLayout({ children }) {
   return (
      <html lang="en">
         <body>
            <AuthProvider>
               <Header />
               <main id="content">{children}</main>
               <Footer />
            </AuthProvider>
         </body>
      </html>
   );
}
