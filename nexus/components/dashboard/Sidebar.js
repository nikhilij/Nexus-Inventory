// components/dashboard/Sidebar.js
export default function Sidebar() {
   return (
      <div className="w-64 bg-gray-800 text-white p-4">
         <h2 className="text-xl font-bold mb-4">Dashboard</h2>
         <ul>
            <li className="mb-2">
               <a href="/dashboard">Overview</a>
            </li>
            <li className="mb-2">
               <a href="/dashboard/products">Products</a>
            </li>
            <li className="mb-2">
               <a href="/dashboard/inventory">Inventory</a>
            </li>
            <li className="mb-2">
               <a href="/dashboard/orders">Orders</a>
            </li>
            <li className="mb-2">
               <a href="/dashboard/reports">Reports</a>
            </li>
            <li className="mb-2">
               <a href="/dashboard/settings">Settings</a>
            </li>
         </ul>
      </div>
   );
}
