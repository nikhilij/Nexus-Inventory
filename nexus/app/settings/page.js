"use client";

import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import { FiUser, FiShield, FiBell, FiTablet, FiDatabase, FiKey, FiMail, FiPhone } from "react-icons/fi";

export default function Settings() {
   const settingsSections = [
      {
         id: "profile",
         title: "Profile Settings",
         description: "Manage your account information and preferences",
         icon: FiUser,
         items: [
            { label: "Personal Information", value: "John Doe" },
            { label: "Email Address", value: "john.doe@example.com" },
            { label: "Phone Number", value: "+1 (555) 123-4567" },
            { label: "Company", value: "Nexus Corp" },
         ],
      },
      {
         id: "security",
         title: "Security Settings",
         description: "Configure security preferences and authentication",
         icon: FiShield,
         items: [
            { label: "Two-Factor Authentication", value: "Enabled" },
            { label: "PIN Verification", value: "Required" },
            { label: "Session Timeout", value: "30 minutes" },
            { label: "Login Notifications", value: "Enabled" },
         ],
      },
      {
         id: "notifications",
         title: "Notification Preferences",
         description: "Choose how you want to be notified",
         icon: FiBell,
         items: [
            { label: "Email Notifications", value: "Enabled" },
            { label: "Push Notifications", value: "Enabled" },
            { label: "Low Stock Alerts", value: "Enabled" },
            { label: "Order Updates", value: "Enabled" },
         ],
      },
      {
         id: "appearance",
         title: "Appearance",
         description: "Customize the look and feel of your dashboard",
         icon: FiTablet,
         items: [
            { label: "Theme", value: "Light" },
            { label: "Language", value: "English" },
            { label: "Timezone", value: "UTC-8 (PST)" },
            { label: "Date Format", value: "MM/DD/YYYY" },
         ],
      },
   ];

   return (
      <AuthenticatedLayout>
         <div className="space-y-6">
            {/* Header */}
            <div>
               <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
               <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>

            {/* Settings Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {settingsSections.map((section) => {
                  const Icon = section.icon;
                  return (
                     <div key={section.id} className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center mb-4">
                           <div className="p-2 bg-indigo-100 rounded-lg">
                              <Icon className="h-6 w-6 text-indigo-600" />
                           </div>
                           <div className="ml-4">
                              <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                              <p className="text-sm text-gray-600">{section.description}</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                           {section.items.map((item, index) => (
                              <div
                                 key={index}
                                 className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                              >
                                 <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                 <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-900">{item.value}</span>
                                    <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                                       Edit
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>

                        <div className="mt-6">
                           <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                              Save Changes
                           </button>
                        </div>
                     </div>
                  );
               })}
            </div>

            {/* System Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
               <div className="flex items-center mb-6">
                  <div className="p-2 bg-gray-100 rounded-lg">
                     <FiDatabase className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="ml-4">
                     <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
                     <p className="text-sm text-gray-600">Advanced system configuration options</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data Retention Period</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                           <option>30 days</option>
                           <option>90 days</option>
                           <option>1 year</option>
                           <option>2 years</option>
                        </select>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Auto-backup Frequency</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                           <option>Daily</option>
                           <option>Weekly</option>
                           <option>Monthly</option>
                        </select>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                           <option>USD ($)</option>
                           <option>EUR (€)</option>
                           <option>GBP (£)</option>
                        </select>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
                        <input
                           type="number"
                           defaultValue="10"
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                     </div>
                  </div>
               </div>

               <div className="mt-6 flex gap-3">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                     Save System Settings
                  </button>
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                     Reset to Defaults
                  </button>
               </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
               <div className="flex items-center mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                     <FiKey className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                     <h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
                     <p className="text-sm text-gray-600">Irreversible and destructive actions</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                     <div>
                        <h3 className="text-sm font-medium text-gray-900">Reset All Data</h3>
                        <p className="text-sm text-gray-600">Permanently delete all inventory data and settings</p>
                     </div>
                     <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
                        Reset Data
                     </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                     <div>
                        <h3 className="text-sm font-medium text-gray-900">Delete Account</h3>
                        <p className="text-sm text-gray-600">Permanently delete your account and all associated data</p>
                     </div>
                     <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
                        Delete Account
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </AuthenticatedLayout>
   );
}
