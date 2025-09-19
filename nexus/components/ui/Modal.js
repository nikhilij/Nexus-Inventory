// components/ui/Modal.js
import { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, children }) {
   useEffect(() => {
      const handleEscape = (e) => {
         if (e.key === "Escape") onClose();
      };
      if (isOpen) document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
   }, [isOpen, onClose]);

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
         <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
         <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b">
               <h3 className="text-lg font-semibold">{title}</h3>
               <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  &times;
               </button>
            </div>
            <div className="p-4">{children}</div>
         </div>
      </div>
   );
}
