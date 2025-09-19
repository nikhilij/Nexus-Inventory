"use client";

import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import { FiPlus, FiSearch, FiFilter, FiEdit, FiTrash2, FiPhone, FiMail, FiMapPin, FiPackage } from "react-icons/fi";

export default function Suppliers() {
   const suppliers = [
      {
         id: 1,
         name: "TechCorp Inc.",
         contact: "John Smith",
         email: "john@techcorp.com",
         phone: "+1 (555) 123-4567",
         address: "123 Tech Street, Silicon Valley, CA",
         products: 15,
         status: "Active",
         lastOrder: "2024-01-10",
      },
      {
         id: 2,
         name: "Global Electronics",
         contact: "Sarah Johnson",
         email: "sarah@globalelec.com",
         phone: "+1 (555) 234-5678",
         address: "456 Electronics Ave, Austin, TX",
         products: 8,
         status: "Active",
         lastOrder: "2024-01-08",
      },
      {
         id: 3,
         name: "Premium Accessories",
         contact: "Mike Davis",
         email: "mike@premiumacc.com",
         phone: "+1 (555) 345-6789",
         address: "789 Accessory Blvd, Seattle, WA",
         products: 12,
         status: "Inactive",
         lastOrder: "2023-12-15",
      },
      {
         id: 4,
         name: "Quality Cables Ltd",
         contact: "Lisa Chen",
         email: "lisa@qualitycables.com",
         phone: "+1 (555) 456-7890",
         address: "321 Cable Road, Portland, OR",
         products: 6,
         status: "Active",
         lastOrder: "2024-01-12",
      },
      {
         id: 5,
         name: "Audio Solutions",
         contact: "David Wilson",
         email: "david@audiosol.com",
         phone: "+1 (555) 567-8901",
         address: "654 Sound Street, Nashville, TN",
         products: 9,
         status: "Active",
         lastOrder: "2024-01-05",
      },
   ];

   const getStatusColor = (status) => {
      switch (status) {
         case "Active":
            return "text-green-600 bg-green-100";
         case "Inactive":
            return "text-red-600 bg-red-100";
         default:
            return "text-gray-600 bg-gray-100";
      }
   };

   return (
      <AuthenticatedLayout>
         <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div>
                  <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
                  <p className="text-gray-600">Manage your supplier relationships and contacts</p>
               </div>
               <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <FiPlus className="mr-2 h-5 w-5" />
                  Add Supplier
               </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="p-2 bg-green-100 rounded-lg">
                        <FiPackage className="h-6 w-6 text-green-600" />
                     </div>
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Suppliers</p>
                        <p className="text-2xl font-bold text-gray-900">4</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="p-2 bg-red-100 rounded-lg">
                        <FiPackage className="h-6 w-6 text-red-600" />
                     </div>
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Inactive Suppliers</p>
                        <p className="text-2xl font-bold text-gray-900">1</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="p-2 bg-blue-100 rounded-lg">
                        <FiPackage className="h-6 w-6 text-blue-600" />
                     </div>
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Products</p>
                        <p className="text-2xl font-bold text-gray-900">50</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
               <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                     <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                           type="text"
                           placeholder="Search suppliers..."
                           className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                     </div>
                  </div>
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                     <FiFilter className="mr-2 h-5 w-5" />
                     Filters
                  </button>
               </div>
            </div>

            {/* Suppliers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {suppliers.map((supplier) => (
                  <div
                     key={supplier.id}
                     className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                     {/* Header */}
                     <div className="flex items-start justify-between mb-4">
                        <div>
                           <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                           <p className="text-sm text-gray-600">{supplier.contact}</p>
                        </div>
                        <span
                           className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(supplier.status)}`}
                        >
                           {supplier.status}
                        </span>
                     </div>

                     {/* Contact Info */}
                     <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                           <FiMail className="h-4 w-4 mr-2" />
                           <span>{supplier.email}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                           <FiPhone className="h-4 w-4 mr-2" />
                           <span>{supplier.phone}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                           <FiMapPin className="h-4 w-4 mr-2" />
                           <span className="truncate">{supplier.address}</span>
                        </div>
                     </div>

                     {/* Stats */}
                     <div className="flex items-center justify-between mb-4">
                        <div className="text-center">
                           <p className="text-2xl font-bold text-gray-900">{supplier.products}</p>
                           <p className="text-xs text-gray-600">Products</p>
                        </div>
                        <div className="text-center">
                           <p className="text-sm font-medium text-gray-900">
                              {new Date(supplier.lastOrder).toLocaleDateString()}
                           </p>
                           <p className="text-xs text-gray-600">Last Order</p>
                        </div>
                     </div>

                     {/* Actions */}
                     <div className="flex gap-2">
                        <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                           <FiEdit className="mr-2 h-4 w-4" />
                           Edit
                        </button>
                        <button className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                           <FiPackage className="mr-2 h-4 w-4" />
                           Order
                        </button>
                     </div>
                  </div>
               ))}
            </div>

            {/* Add New Supplier Card */}
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-indigo-400 transition-colors cursor-pointer">
               <div className="text-center">
                  <FiPlus className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Add New Supplier</h3>
                  <p className="mt-1 text-sm text-gray-500">Expand your supplier network</p>
               </div>
            </div>
         </div>
      </AuthenticatedLayout>
   );
}
