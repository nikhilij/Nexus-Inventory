// components/dashboard/NotificationList.js
export default function NotificationList() {
   return (
      <div className="bg-white p-4 rounded shadow">
         <h3 className="text-lg font-bold mb-4">Notifications</h3>
         <ul>
            <li className="mb-2 p-2 bg-gray-100 rounded">Low stock alert for Product A</li>
            <li className="mb-2 p-2 bg-gray-100 rounded">New order received</li>
            <li className="mb-2 p-2 bg-gray-100 rounded">Supplier delivery scheduled</li>
         </ul>
      </div>
   );
}
