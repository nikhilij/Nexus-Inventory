// components/ui/Button.js
export default function Button({ children, onClick, variant = "primary", size = "md", disabled = false }) {
   const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";
   const sizeClasses = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
   };
   const variantClasses = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
   };

   return (
      <button
         className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
         onClick={onClick}
         disabled={disabled}
      >
         {children}
      </button>
   );
}
