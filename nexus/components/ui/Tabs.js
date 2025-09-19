// components/ui/Tabs.js
import { useState } from "react";

export default function Tabs({ tabs, defaultTab = 0 }) {
   const [activeTab, setActiveTab] = useState(defaultTab);

   return (
      <div>
         <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
               {tabs.map((tab, index) => (
                  <button
                     key={index}
                     onClick={() => setActiveTab(index)}
                     className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                        activeTab === index
                           ? "border-blue-500 text-blue-600"
                           : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                     }`}
                  >
                     {tab.label}
                  </button>
               ))}
            </nav>
         </div>
         <div className="mt-4">{tabs[activeTab].content}</div>
      </div>
   );
}
