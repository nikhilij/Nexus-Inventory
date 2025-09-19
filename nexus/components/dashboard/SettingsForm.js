// components/dashboard/SettingsForm.js
export default function SettingsForm() {
   return (
      <div className="bg-white p-4 rounded shadow">
         <h3 className="text-lg font-bold mb-4">Settings</h3>
         <form>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">Company Name</label>
               <input type="text" className="w-full p-2 border rounded" />
            </div>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-2">Email</label>
               <input type="email" className="w-full p-2 border rounded" />
            </div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
               Save Settings
            </button>
         </form>
      </div>
   );
}
