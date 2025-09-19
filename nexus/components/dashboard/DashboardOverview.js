// components/dashboard/DashboardOverview.js
export default function DashboardOverview() {
   return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-bold">Total Products</h3>
            <p className="text-2xl">150</p>
         </div>
         <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-bold">Total Orders</h3>
            <p className="text-2xl">45</p>
         </div>
         <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-bold">Low Stock Items</h3>
            <p className="text-2xl">12</p>
         </div>
         <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-bold">Revenue</h3>
            <p className="text-2xl">$12,500</p>
         </div>
      </div>
   );
}
