// components/ui/Loading.js
export default function Loading({ size = "md", message = "Loading..." }) {
   const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-8 h-8",
      lg: "w-12 h-12",
   };

   return (
      <div className="flex flex-col items-center justify-center">
         <div
            className={`${sizeClasses[size]} border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin`}
         ></div>
         {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
      </div>
   );
}
