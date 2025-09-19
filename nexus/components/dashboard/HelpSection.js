// components/dashboard/HelpSection.js
export default function HelpSection() {
   return (
      <div className="bg-white p-4 rounded shadow">
         <h3 className="text-lg font-bold mb-4">Help & Support</h3>
         <div className="space-y-4">
            <div>
               <h4 className="font-semibold">Getting Started</h4>
               <p className="text-sm text-gray-600">Learn how to set up your inventory system.</p>
            </div>
            <div>
               <h4 className="font-semibold">FAQ</h4>
               <p className="text-sm text-gray-600">Find answers to common questions.</p>
            </div>
            <div>
               <h4 className="font-semibold">Contact Support</h4>
               <p className="text-sm text-gray-600">Get in touch with our support team.</p>
            </div>
         </div>
      </div>
   );
}
