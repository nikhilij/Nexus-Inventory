// components/dashboard/SupplierForm.js
export default function SupplierForm() {
   return (
      <div className="bg-white p-4 rounded shadow">
         <h3 className="text-lg font-bold mb-4">Add/Edit Supplier</h3>
         <form>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">Name</label>
               <input type="text" className="w-full p-2 border rounded" />
            </div>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">Contact Email</label>
               <input type="email" className="w-full p-2 border rounded" />
            </div>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">Phone</label>
               <input type="tel" className="w-full p-2 border rounded" />
            </div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer">
               Save Supplier
            </button>
         </form>
      </div>
   );
}
