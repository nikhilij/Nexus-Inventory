"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import { FiPackage, FiTrendingUp, FiAlertTriangle, FiCheckCircle, FiShield } from "react-icons/fi";

export default function Dashboard() {
   const { data: session, status } = useSession();
   const router = useRouter();
   const [pinStatus, setPinStatus] = useState(null);

   useEffect(() => {
      if (status === "unauthenticated") {
         router.push("/login");
      }
   }, [status, router]);

   useEffect(() => {
      // Check PIN verification status
      const checkPinStatus = async () => {
         try {
            const response = await fetch("/api/validate-pin");
            const data = await response.json();
            setPinStatus(data);
         } catch (error) {
            console.error("Failed to check PIN status:", error);
         }
      };

      if (session) {
         checkPinStatus();
      }
   }, [session]);

   if (status === "loading") {
      return (
         <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
         </div>
      );
   }

   if (!session) {
      return null;
   }

   return (
      <AuthenticatedLayout>
         <div className="space-y-6">
            {/* Security Notice */}
            {!pinStatus?.verified && (
               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                     <FiAlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
                     <div>
                        <h3 className="text-sm font-medium text-yellow-800">Security Verification Required</h3>
                        <p className="mt-1 text-sm text-yellow-700">
                           You need to verify your PIN to access inventory features.
                           <button
                              onClick={() => router.push("/verify-pin")}
                              className="ml-2 font-medium underline hover:text-yellow-800"
                           >
                              Verify PIN
                           </button>
                        </p>
                     </div>
                  </div>
               </div>
            )}

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="flex-shrink-0">
                        <FiPackage className="h-6 w-6 text-gray-400" />
                     </div>
                     <div className="ml-5 w-0 flex-1">
                        <dl>
                           <dt className="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                           <dd className="text-lg font-medium text-gray-900">
                              {pinStatus?.verified ? "1,234" : "••••"}
                           </dd>
                        </dl>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="flex-shrink-0">
                        <FiTrendingUp className="h-6 w-6 text-gray-400" />
                     </div>
                     <div className="ml-5 w-0 flex-1">
                        <dl>
                           <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
                           <dd className="text-lg font-medium text-gray-900">{pinStatus?.verified ? "23" : "••"}</dd>
                        </dl>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="flex-shrink-0">
                        <FiCheckCircle className="h-6 w-6 text-gray-400" />
                     </div>
                     <div className="ml-5 w-0 flex-1">
                        <dl>
                           <dt className="text-sm font-medium text-gray-500 truncate">Active Orders</dt>
                           <dd className="text-lg font-medium text-gray-900">{pinStatus?.verified ? "156" : "•••"}</dd>
                        </dl>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="flex-shrink-0">
                        <FiAlertTriangle className="h-6 w-6 text-gray-400" />
                     </div>
                     <div className="ml-5 w-0 flex-1">
                        <dl>
                           <dt className="text-sm font-medium text-gray-500 truncate">Pending Alerts</dt>
                           <dd className="text-lg font-medium text-gray-900">{pinStatus?.verified ? "7" : "•"}</dd>
                        </dl>
                     </div>
                  </div>
               </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-lg shadow-sm p-6">
               {pinStatus?.verified ? (
                  <div>
                     <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Overview</h3>
                     <div className="text-center py-12">
                        <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Inventory Management System</h3>
                        <p className="mt-1 text-sm text-gray-500">
                           Access to inventory features is secured with PIN verification.
                        </p>
                        <div className="mt-6">
                           <p className="text-xs text-gray-400">
                              PIN verified at:{" "}
                              {pinStatus.verifiedAt ? new Date(pinStatus.verifiedAt).toLocaleString() : "Unknown"}
                           </p>
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="text-center py-12">
                     <FiShield className="mx-auto h-12 w-12 text-gray-400" />
                     <h3 className="mt-2 text-sm font-medium text-gray-900">Access Restricted</h3>
                     <p className="mt-1 text-sm text-gray-500">Please verify your PIN to access inventory features.</p>
                     <div className="mt-6">
                        <button
                           onClick={() => router.push("/verify-pin")}
                           className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                           <FiShield className="mr-2 h-5 w-5" />
                           Verify PIN
                        </button>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </AuthenticatedLayout>
   );
}
