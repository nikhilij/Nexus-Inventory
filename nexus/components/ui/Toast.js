// components/ui/Toast.js
import { useEffect } from "react";

export default function Toast({ message, type = "info", onClose, duration = 5000 }) {
   useEffect(() => {
      if (duration > 0) {
         const timer = setTimeout(onClose, duration);
         return () => clearTimeout(timer);
      }
   }, [onClose, duration]);

   const typeClasses = {
      info: "bg-blue-500 text-white",
      success: "bg-green-500 text-white",
      warning: "bg-yellow-500 text-white",
      error: "bg-red-500 text-white",
   };

   return (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${typeClasses[type]}`}>
         <div className="flex items-center justify-between">
            <span>{message}</span>
            <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
               &times;
            </button>
         </div>
      </div>
   );
}
