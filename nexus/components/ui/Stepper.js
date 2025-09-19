// components/ui/Stepper.js
import { useState } from "react";

export default function Stepper({ steps, currentStep = 0 }) {
   return (
      <div className="w-full">
         <div className="flex items-center justify-between">
            {steps.map((step, index) => (
               <div key={index} className="flex items-center">
                  <div
                     className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        index <= currentStep ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
                     }`}
                  >
                     {index + 1}
                  </div>
                  <span
                     className={`ml-2 text-sm font-medium ${index <= currentStep ? "text-blue-600" : "text-gray-500"}`}
                  >
                     {step.title}
                  </span>
                  {index < steps.length - 1 && (
                     <div className={`flex-1 h-1 mx-4 ${index < currentStep ? "bg-blue-500" : "bg-gray-200"}`} />
                  )}
               </div>
            ))}
         </div>
         <div className="mt-4">{steps[currentStep] && steps[currentStep].content}</div>
      </div>
   );
}
