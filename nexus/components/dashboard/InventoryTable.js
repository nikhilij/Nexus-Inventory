// components/dashboard/InventoryTable.js
export default function InventoryTable() {
   return (
      <div className="bg-white p-4 rounded shadow">
         <h3 className="text-lg font-bold mb-4">Inventory Table</h3>
         <table className="w-full">
            <thead>
               <tr>
                  <th className="text-left">Product</th>
                  <th className="text-left">Warehouse</th>
                  <th className="text-left">Quantity</th>
                  <th className="text-left">Status</th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <td>Sample Product</td>
                  <td>Main Warehouse</td>
                  <td>100</td>
                  <td>In Stock</td>
               </tr>
            </tbody>
         </table>
      </div>
   );
}
