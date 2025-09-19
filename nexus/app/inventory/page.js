"use client";

import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import { FiAlertTriangle, FiCheckCircle, FiTrendingUp, FiTrendingDown, FiPackage, FiSearch } from "react-icons/fi";

export default function Inventory() {
   const inventoryItems = [
      {
         id: 1,
         name: "Wireless Headphones",
         sku: "WH-001",
         currentStock: 45,
         minStock: 20,
         maxStock: 100,
         status: "Good",
         lastUpdated: "2 hours ago",
      },
      {
         id: 2,
         name: "Laptop Stand",
         sku: "LS-002",
         currentStock: 12,
         minStock: 15,
         maxStock: 50,
         status: "Low",
         lastUpdated: "1 hour ago",
      },
      {
         id: 3,
         name: "USB Cable",
         sku: "UC-003",
         currentStock: 0,
         minStock: 25,
         maxStock: 200,
         status: "Out",
         lastUpdated: "3 hours ago",
      },
      {
         id: 4,
         name: "Bluetooth Speaker",
         sku: "BS-004",
         currentStock: 23,
         minStock: 10,
         maxStock: 75,
         status: "Good",
         lastUpdated: "30 minutes ago",
      },
      {
         id: 5,
         name: "Mouse Pad",
         sku: "MP-005",
         currentStock: 67,
         minStock: 30,
         maxStock: 150,
         status: "Good",
         lastUpdated: "4 hours ago",
      },
   ];

   const getStatusIcon = (status) => {
      switch (status) {
         case "Good":
            return <FiCheckCircle className="h-5 w-5 text-green-500" />;
         case "Low":
            return <FiAlertTriangle className="h-5 w-5 text-yellow-500" />;
         case "Out":
            return <FiTrendingDown className="h-5 w-5 text-red-500" />;
         default:
            return <FiPackage className="h-5 w-5 text-gray-500" />;
      }
   };

   const getStatusColor = (status) => {
      switch (status) {
         case "Good":
            return "text-green-600 bg-green-100";
         case "Low":
            return "text-yellow-600 bg-yellow-100";
         case "Out":
            return "text-red-600 bg-red-100";
         default:
            return "text-gray-600 bg-gray-100";
      }
   };

   const getStockPercentage = (current, max) => {
      return Math.min((current / max) * 100, 100);
   };

   return (
      <AuthenticatedLayout>
         <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div>
                  <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                  <p className="text-gray-600">Monitor and manage your stock levels</p>
               </div>
               <div className="flex gap-3">
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                     Export Report
                  </button>
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                     Update Stock
                  </button>
               </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="p-2 bg-green-100 rounded-lg">
                        <FiCheckCircle className="h-6 w-6 text-green-600" />
                     </div>
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">In Stock</p>
                        <p className="text-2xl font-bold text-gray-900">3</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="p-2 bg-yellow-100 rounded-lg">
                        <FiAlertTriangle className="h-6 w-6 text-yellow-600" />
                     </div>
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Low Stock</p>
                        <p className="text-2xl font-bold text-gray-900">1</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="p-2 bg-red-100 rounded-lg">
                        <FiTrendingDown className="h-6 w-6 text-red-600" />
                     </div>
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                        <p className="text-2xl font-bold text-gray-900">1</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="p-2 bg-blue-100 rounded-lg">
                        <FiTrendingUp className="h-6 w-6 text-blue-600" />
                     </div>
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Value</p>
                        <p className="text-2xl font-bold text-gray-900">$12,450</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow-sm p-4">
               <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                     type="text"
                     placeholder="Search inventory..."
                     className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
               </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                        <tr>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Current Stock
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Min/Max
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Stock Level
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Updated
                           </th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                        {inventoryItems.map((item) => (
                           <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                       <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                          <FiPackage className="h-5 w-5 text-gray-500" />
                                       </div>
                                    </div>
                                    <div className="ml-4">
                                       <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                       <div className="text-sm text-gray-500">{item.sku}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="text-sm text-gray-900">{item.currentStock}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="text-sm text-gray-900">
                                    {item.minStock} / {item.maxStock}
                                 </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                       className={`h-2 rounded-full ${
                                          item.status === "Good"
                                             ? "bg-green-500"
                                             : item.status === "Low"
                                               ? "bg-yellow-500"
                                               : "bg-red-500"
                                       }`}
                                       style={{ width: `${getStockPercentage(item.currentStock, item.maxStock)}%` }}
                                    ></div>
                                 </div>
                                 <div className="text-xs text-gray-500 mt-1">
                                    {Math.round(getStockPercentage(item.currentStock, item.maxStock))}%
                                 </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="flex items-center">
                                    {getStatusIcon(item.status)}
                                    <span
                                       className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}
                                    >
                                       {item.status === "Good"
                                          ? "In Stock"
                                          : item.status === "Low"
                                            ? "Low Stock"
                                            : "Out of Stock"}
                                    </span>
                                 </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.lastUpdated}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Low Stock Alert */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
               <div className="flex items-center">
                  <FiAlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
                  <div>
                     <h3 className="text-sm font-medium text-yellow-800">Low Stock Alert</h3>
                     <p className="mt-1 text-sm text-yellow-700">
                        1 item is running low on stock. Consider restocking to avoid stockouts.
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </AuthenticatedLayout>
   );
}
