// components/dashboard/OrderList.js
export default function OrderList() {
   return (
      <div className="bg-white p-4 rounded shadow">
         <h3 className="text-lg font-bold mb-4">Order List</h3>
         <table className="w-full">
            <thead>
               <tr>
                  <th className="text-left">Order ID</th>
                  <th className="text-left">Customer</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Total</th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <td>#12345</td>
                  <td>John Doe</td>
                  <td>Processing</td>
                  <td>$150.00</td>
               </tr>
            </tbody>
         </table>
      </div>
   );
}
