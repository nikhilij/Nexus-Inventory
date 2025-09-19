// components/dashboard/UserList.js
export default function UserList() {
   return (
      <div className="bg-white p-4 rounded shadow">
         <h3 className="text-lg font-bold mb-4">User List</h3>
         <table className="w-full">
            <thead>
               <tr>
                  <th className="text-left">Name</th>
                  <th className="text-left">Email</th>
                  <th className="text-left">Role</th>
               </tr>
            </thead>
            <tbody>
               <tr>
                  <td>John Doe</td>
                  <td>john@example.com</td>
                  <td>Admin</td>
               </tr>
            </tbody>
         </table>
      </div>
   );
}
