"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiLock, FiArrowRight } from "react-icons/fi";
import { FiMail } from "react-icons/fi";

export default function PinVerificationPage() {
   const [pin, setPin] = useState("");
   const [error, setError] = useState(null);
   const [isLoading, setIsLoading] = useState(false);
   const [isVerified, setIsVerified] = useState(false);
   const { data: session, status } = useSession();
   const router = useRouter();

   useEffect(() => {
      // Check if user is already verified and verification is still valid
      const verified = localStorage.getItem("pinVerified");
      const verifiedAt = localStorage.getItem("pinVerifiedAt");
      const verifiedUser = localStorage.getItem("pinVerifiedUser");

      if (verified === "true" && verifiedAt && verifiedUser) {
         const verificationTime = new Date(verifiedAt);
         const now = new Date();
         const hoursSinceVerification = (now - verificationTime) / (1000 * 60 * 60);

         // Check if verification is still valid (within 24 hours) and for the same user
         if (hoursSinceVerification < 24 && verifiedUser === session?.user?.email) {
            setIsVerified(true);
            router.push("/dashboard");
         } else {
            // Clear expired verification
            localStorage.removeItem("pinVerified");
            localStorage.removeItem("pinVerifiedAt");
            localStorage.removeItem("pinVerifiedUser");
         }
      }
   }, [router, session]);

   useEffect(() => {
      if (status === "unauthenticated") {
         router.push("/login");
      }
   }, [status, router]);

   const handlePinSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);

      try {
         const response = await fetch("/api/validate-pin", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({ pin }),
         });

         const data = await response.json();

         if (data.ok) {
            // Store verification in localStorage for client-side checks
            localStorage.setItem("pinVerified", "true");
            localStorage.setItem("pinVerifiedAt", new Date().toISOString());
            localStorage.setItem("pinVerifiedUser", session?.user?.email);

            setIsVerified(true);

            // Get callback URL from search params or default to dashboard
            const urlParams = new URLSearchParams(window.location.search);
            const callbackUrl = urlParams.get("callbackUrl") || "/dashboard";

            router.push(callbackUrl);
         } else {
            // If backend indicates PIN is not set up, redirect to setup page
            if (data.needsSetup) {
               router.push("/setup-pin");
               return;
            }

            setError(data.error || "Invalid PIN");
            setPin("");
         }
      } catch (err) {
         setError("Failed to validate PIN. Please try again.");
      } finally {
         setIsLoading(false);
      }
   };

   const handlePinChange = (e) => {
      const value = e.target.value.replace(/\D/g, ""); // Only allow digits
      if (value.length <= 6) {
         setPin(value);
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

   return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
         <div className="max-w-md w-full space-y-8">
            <div className="text-center">
               <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
                  <FiLock className="h-6 w-6 text-blue-600" />
               </div>
               <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Security Verification</h2>
               <p className="mt-2 text-sm text-gray-600">Enter your 6-digit PIN to access the inventory system</p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handlePinSubmit}>
               <div>
                  <label htmlFor="pin" className="sr-only">
                     PIN Code
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
                        onChange={handlePinChange}
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

               {error && (
                  <div className="rounded-md bg-red-50 p-4">
                     <div className="text-sm text-red-700">{error}</div>
                  </div>
               )}

               <div>
                  <button
                     type="submit"
                     disabled={pin.length !== 6 || isLoading}
                     className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
                  >
                     {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                     ) : (
                        <>
                           Verify PIN
                           <FiArrowRight className="ml-2 h-5 w-5" />
                        </>
                     )}
                  </button>
               </div>

               <div className="text-center">
                  <div className="flex flex-col items-center space-y-2">
                     <p className="text-sm text-gray-600">Forgot your PIN? You can request a reset link.</p>
                     <button
                        type="button"
                        onClick={async () => {
                           setIsLoading(true);
                           setError(null);
                           try {
                              const res = await fetch("/api/forgot-pin", {
                                 method: "POST",
                                 headers: { "Content-Type": "application/json" },
                                 body: JSON.stringify({ email: session?.user?.email }),
                              });
                              const body = await res.json();
                              if (body.ok) {
                                 setError("Reset link generated. Check your email (or use the provided link in dev).");
                                 if (body.resetLink) {
                                    setTimeout(() => {
                                       window.open(body.resetLink, "_blank");
                                    }, 300);
                                 }
                              } else {
                                 setError(body.error || "Unable to request reset");
                              }
                           } catch (err) {
                              setError("Failed to request reset. Try again later.");
                           } finally {
                              setIsLoading(false);
                           }
                        }}
                        className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                     >
                        <FiMail className="mr-2" /> Request reset
                     </button>
                  </div>
               </div>
            </form>
         </div>
      </div>
   );
}
