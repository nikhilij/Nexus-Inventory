// components/dashboard/OrderForm.js
export default function OrderForm() {
   return (
      <div className="bg-white p-4 rounded shadow">
         <h3 className="text-lg font-bold mb-4">Create Order</h3>
         <form>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">Customer</label>
               <input type="text" className="w-full p-2 border rounded" />
            </div>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">Products</label>
               <select className="w-full p-2 border rounded">
                  <option>Select Product</option>
               </select>
            </div>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">Quantity</label>
               <input type="number" className="w-full p-2 border rounded" />
            </div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer">
               Create Order
            </button>
         </form>
      </div>
   );
}
