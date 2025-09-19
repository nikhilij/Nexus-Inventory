// components/ui/Card.js
export default function Card({ title, children, className = "" }) {
   return (
      <div className={`bg-white rounded-lg shadow-md ${className}`}>
         {title && (
            <div className="px-6 py-4 border-b border-gray-200">
               <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            </div>
         )}
         <div className="p-6">{children}</div>
      </div>
   );
}
