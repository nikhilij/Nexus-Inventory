// components/ui/Carousel.js
import { useState } from "react";

export default function Carousel({ items }) {
   const [currentIndex, setCurrentIndex] = useState(0);

   const nextSlide = () => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
   };

   const prevSlide = () => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
   };

   return (
      <div className="relative w-full max-w-2xl mx-auto">
         <div className="overflow-hidden rounded-lg">
            <div
               className="flex transition-transform duration-300"
               style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
               {items.map((item, index) => (
                  <div key={index} className="w-full flex-shrink-0">
                     {item}
                  </div>
               ))}
            </div>
         </div>
         <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
         >
            ‹
         </button>
         <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
         >
            ›
         </button>
         <div className="flex justify-center mt-4 space-x-2">
            {items.map((_, index) => (
               <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full ${index === currentIndex ? "bg-blue-500" : "bg-gray-300"}`}
               />
            ))}
         </div>
      </div>
   );
}
