// components/dashboard/ProductForm.js
export default function ProductForm() {
   return (
      <div className="bg-white p-4 rounded shadow">
         <h3 className="text-lg font-bold mb-4">Add/Edit Product</h3>
         <form>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">Name</label>
               <input type="text" className="w-full p-2 border rounded" />
            </div>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">SKU</label>
               <input type="text" className="w-full p-2 border rounded" />
            </div>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">Price</label>
               <input type="number" className="w-full p-2 border rounded" />
            </div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer">
               Save
            </button>
         </form>
      </div>
   );
}
