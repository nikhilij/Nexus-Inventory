// components/ui/Progress.js
export default function Progress({ value, max = 100, size = "md", color = "blue" }) {
   const percentage = (value / max) * 100;
   const sizeClasses = {
      sm: "h-2",
      md: "h-3",
      lg: "h-4",
   };
   const colorClasses = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      red: "bg-red-500",
   };

   return (
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
         <div
            className={`h-full rounded-full ${colorClasses[color]} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
         ></div>
      </div>
   );
}
