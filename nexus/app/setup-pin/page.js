"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiLock, FiArrowRight, FiCheckCircle } from "react-icons/fi";

export default function PinSetupPage() {
   const [pin, setPin] = useState("");
   const [confirmPin, setConfirmPin] = useState("");
   const [error, setError] = useState(null);
   const [isLoading, setIsLoading] = useState(false);
   const [isSuccess, setIsSuccess] = useState(false);
   const { data: session, status } = useSession();
   const router = useRouter();

   useEffect(() => {
      if (status === "unauthenticated") {
         router.push("/login");
      }
   }, [status, router]);

   const handlePinSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);

      // Validate PINs match
      if (pin !== confirmPin) {
         setError("PINs do not match");
         setIsLoading(false);
         return;
      }

      try {
         const response = await fetch("/api/setup-pin", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({ pin }),
         });

         const data = await response.json();

         if (data.ok) {
            setIsSuccess(true);
            // Redirect to dashboard after success
            setTimeout(() => {
               router.push("/dashboard");
            }, 2000);
         } else {
            setError(data.error || "Failed to set up PIN");
         }
      } catch (err) {
         setError("Failed to set up PIN. Please try again.");
      } finally {
         setIsLoading(false);
      }
   };

   const handlePinChange = (value, isConfirm = false) => {
      const cleanValue = value.replace(/\D/g, ""); // Only allow digits
      if (cleanValue.length <= 6) {
         if (isConfirm) {
            setConfirmPin(cleanValue);
         } else {
            setPin(cleanValue);
         }
      }
   };

   if (status === "loading") {
      return (
         <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
         </div>
      );
   }

   if (!session) {
      return null;
   }

   if (isSuccess) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
               <div className="text-center">
                  <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
                     <FiCheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h2 className="mt-6 text-3xl font-extrabold text-gray-900">PIN Set Up Successfully!</h2>
                  <p className="mt-2 text-sm text-gray-600">Redirecting you to the dashboard...</p>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
         <div className="max-w-md w-full space-y-8">
            <div className="text-center">
               <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
                  <FiLock className="h-6 w-6 text-blue-600" />
               </div>
               <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Set Up Your PIN</h2>
               <p className="mt-2 text-sm text-gray-600">Create a 6-digit PIN to secure your inventory access</p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handlePinSubmit}>
               <div className="space-y-4">
                  <div>
                     <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                        Enter PIN (6 digits)
                     </label>
                     <div className="relative">
                        <input
                           id="pin"
                           name="pin"
                           type="password"
                           inputMode="numeric"
                           pattern="[0-9]*"
                           autoComplete="off"
                           required
                           className="appearance-none relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-lg text-center tracking-widest"
                           placeholder="000000"
                           value={pin}
                           onChange={(e) => handlePinChange(e.target.value)}
                           maxLength={6}
                           disabled={isLoading}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <div className="flex space-x-2">
                              {[...Array(6)].map((_, i) => (
                                 <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full ${pin.length > i ? "bg-blue-600" : "bg-gray-300"}`}
                                 />
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div>
                     <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm PIN
                     </label>
                     <div className="relative">
                        <input
                           id="confirmPin"
                           name="confirmPin"
                           type="password"
                           inputMode="numeric"
                           pattern="[0-9]*"
                           autoComplete="off"
                           required
                           className="appearance-none relative block w-full px-3 py-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-lg text-center tracking-widest"
                           placeholder="000000"
                           value={confirmPin}
                           onChange={(e) => handlePinChange(e.target.value, true)}
                           maxLength={6}
                           disabled={isLoading}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <div className="flex space-x-2">
                              {[...Array(6)].map((_, i) => (
                                 <div
                                    key={i}
                                    className={`w-3 h-3 rounded-full ${confirmPin.length > i ? "bg-blue-600" : "bg-gray-300"}`}
                                 />
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {error && (
                  <div className="rounded-md bg-red-50 p-4">
                     <div className="text-sm text-red-700">{error}</div>
                  </div>
               )}

               <div>
                  <button
                     type="submit"
                     disabled={pin.length !== 6 || confirmPin.length !== 6 || isLoading}
                     className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                  >
                     {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                     ) : (
                        <>
                           Set Up PIN
                           <FiArrowRight className="ml-2 h-5 w-5" />
                        </>
                     )}
                  </button>
               </div>

               <div className="text-center">
                  <p className="text-sm text-gray-600">
                     Your PIN will be required each time you access the inventory system after logging in.
                  </p>
               </div>
            </form>
         </div>
      </div>
   );
}