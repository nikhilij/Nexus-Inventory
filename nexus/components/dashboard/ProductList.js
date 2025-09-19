// components/dashboard/ProductList.js
export default function ProductList() {
   return (
      <div className="bg-white p-4 rounded shadow">
         <h3 className="text-lg font-bold mb-4">Product List</h3>
         <table className="w-full">
            <thead>
               <tr>
                  <th className="text-left">Name</th>
                  <th className="text-left">SKU</th>
                  <th className="text-left">Price</th>
                  <th className="text-left">Stock</th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <td>Sample Product</td>
                  <td>SP001</td>
                  <td>$29.99</td>
                  <td>100</td>
               </tr>
            </tbody>
         </table>
      </div>
   );
}
