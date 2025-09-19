// components/ui/Alert.js
export default function Alert({ type = "info", message, onClose }) {
   const typeClasses = {
      info: "bg-blue-50 border-blue-200 text-blue-800",
      success: "bg-green-50 border-green-200 text-green-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      error: "bg-red-50 border-red-200 text-red-800",
   };

   return (
      <div className={`border-l-4 p-4 ${typeClasses[type]}`}>
         <div className="flex">
            <div className="flex-1">{message}</div>
            {onClose && (
               <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
                  &times;
               </button>
            )}
         </div>
      </div>
   );
}
