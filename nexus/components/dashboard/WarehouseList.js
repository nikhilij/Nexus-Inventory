// components/dashboard/WarehouseList.js
export default function WarehouseList() {
   return (
      <div className="bg-white p-4 rounded shadow">
         <h3 className="text-lg font-bold mb-4">Warehouse List</h3>
         <table className="w-full">
            <thead>
               <tr>
                  <th className="text-left">Name</th>
                  <th className="text-left">Location</th>
                  <th className="text-left">Capacity</th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <td>Main Warehouse</td>
                  <td>New York</td>
                  <td>10,000 sq ft</td>
               </tr>
            </tbody>
         </table>
      </div>
   );
}
