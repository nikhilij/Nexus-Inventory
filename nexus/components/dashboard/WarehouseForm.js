// components/dashboard/WarehouseForm.js
export default function WarehouseForm() {
   return (
      <div className="bg-white p-4 rounded shadow">
         <h3 className="text-lg font-bold mb-4">Add/Edit Warehouse</h3>
         <form>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">Name</label>
               <input type="text" className="w-full p-2 border rounded" />
            </div>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">Location</label>
               <input type="text" className="w-full p-2 border rounded" />
            </div>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">Capacity</label>
               <input type="text" className="w-full p-2 border rounded" />
            </div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
               Save Warehouse
            </button>
         </form>
      </div>
   );
}
