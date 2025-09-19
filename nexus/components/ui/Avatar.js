// components/ui/Avatar.js
import Image from "next/image";

export default function Avatar({ src, alt, size = 40, fallback }) {
   const sizeClasses = {
      32: "w-8 h-8",
      40: "w-10 h-10",
      48: "w-12 h-12",
      64: "w-16 h-16",
   };

   return (
      <div className={`rounded-full overflow-hidden ${sizeClasses[size]}`}>
         {src ? (
            <Image src={src} alt={alt} width={size} height={size} className="w-full h-full object-cover" />
         ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
               {fallback || alt?.charAt(0)?.toUpperCase()}
            </div>
         )}
      </div>
   );
}
