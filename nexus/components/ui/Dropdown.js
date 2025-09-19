// components/ui/Dropdown.js
import { useState } from "react";

export default function Dropdown({ options, value, onChange, placeholder = "Select..." }) {
   const [isOpen, setIsOpen] = useState(false);

   const handleSelect = (option) => {
      onChange(option);
      setIsOpen(false);
   };

   return (
      <div className="relative">
         <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
         >
            {value ? value.label : placeholder}
            <span className="float-right">▼</span>
         </button>
         {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
               {options.map((option, index) => (
                  <div
                     key={index}
                     onClick={() => handleSelect(option)}
                     className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                     {option.label}
                  </div>
               ))}
            </div>
         )}
      </div>
   );
}
