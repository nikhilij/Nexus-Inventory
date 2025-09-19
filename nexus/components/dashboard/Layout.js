// components/dashboard/Layout.js
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children }) {
   return (
      <div className="flex h-screen">
         <Sidebar />
         <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 p-4">{children}</main>
            <Footer />
         </div>
      </div>
   );
}
