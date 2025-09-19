// components/dashboard/InventoryForm.js
export default function InventoryForm() {
   return (
      <div className="bg-white p-4 rounded shadow">
         <h3 className="text-lg font-bold mb-4">Update Inventory</h3>
         <form>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">Product</label>
               <select className="w-full p-2 border rounded">
                  <option>Select Product</option>
               </select>
            </div>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">Warehouse</label>
               <select className="w-full p-2 border rounded">
                  <option>Select Warehouse</option>
               </select>
            </div>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">Quantity</label>
               <input type="number" className="w-full p-2 border rounded" />
            </div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer">
               Update
            </button>
         </form>
      </div>
   );
}
