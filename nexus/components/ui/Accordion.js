// components/ui/Accordion.js
import { useState } from "react";

export default function Accordion({ items }) {
   const [openIndex, setOpenIndex] = useState(null);

   const toggleItem = (index) => {
      setOpenIndex(openIndex === index ? null : index);
   };

   return (
      <div className="border border-gray-200 rounded-md">
         {items.map((item, index) => (
            <div key={index} className="border-b border-gray-200 last:border-b-0">
               <button
                  onClick={() => toggleItem(index)}
                  className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
               >
                  <div className="flex items-center justify-between">
                     <span className="font-medium">{item.title}</span>
                     <span className="text-gray-500">{openIndex === index ? "−" : "+"}</span>
                  </div>
               </button>
               {openIndex === index && <div className="px-4 py-3 bg-white">{item.content}</div>}
            </div>
         ))}
      </div>
   );
}
