import "@/app/globals.css";
import ClientLayout from "@/components/ClientLayout";

export const metadata = {
   title: "Nexus Inventory",
   description: "Inventory management system",
};

export default function RootLayout({ children }) {
   return (
      <html lang="en">
         <body>
            <ClientLayout>{children}</ClientLayout>
         </body>
      </html>
   );
}
