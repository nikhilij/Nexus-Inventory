// components/dashboard/SupplierList.js
export default function SupplierList() {
   return (
      <div className="bg-white p-4 rounded shadow">
         <h3 className="text-lg font-bold mb-4">Supplier List</h3>
         <table className="w-full">
            <thead>
               <tr>
                  <th className="text-left">Name</th>
                  <th className="text-left">Contact</th>
                  <th className="text-left">Products</th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <td>ABC Supplies</td>
                  <td>contact@abc.com</td>
                  <td>50</td>
               </tr>
            </tbody>
         </table>
      </div>
   );
}
