"use client";

import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import { FiPlus, FiSearch, FiFilter, FiEdit, FiTrash2, FiPackage } from "react-icons/fi";

export default function Products() {
   const products = [
      {
         id: 1,
         name: "Wireless Headphones",
         sku: "WH-001",
         category: "Electronics",
         stock: 45,
         price: "$299.99",
         status: "In Stock",
      },
      {
         id: 2,
         name: "Laptop Stand",
         sku: "LS-002",
         category: "Accessories",
         stock: 12,
         price: "$49.99",
         status: "Low Stock",
      },
      { id: 3, name: "USB Cable", sku: "UC-003", category: "Cables", stock: 0, price: "$9.99", status: "Out of Stock" },
      {
         id: 4,
         name: "Bluetooth Speaker",
         sku: "BS-004",
         category: "Electronics",
         stock: 23,
         price: "$79.99",
         status: "In Stock",
      },
      {
         id: 5,
         name: "Mouse Pad",
         sku: "MP-005",
         category: "Accessories",
         stock: 67,
         price: "$14.99",
         status: "In Stock",
      },
   ];

   const getStatusColor = (status) => {
      switch (status) {
         case "In Stock":
            return "text-green-600 bg-green-100";
         case "Low Stock":
            return "text-yellow-600 bg-yellow-100";
         case "Out of Stock":
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
                  <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                  <p className="text-gray-600">Manage your product inventory</p>
               </div>
               <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
                  <FiPlus className="mr-2 h-5 w-5" />
                  Add Product
               </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
               <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                     <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                           type="text"
                           placeholder="Search products..."
                           className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                     </div>
                  </div>
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
                     <FiFilter className="mr-2 h-5 w-5" />
                     Filters
                  </button>
               </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                        <tr>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              SKU
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Stock
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                           </th>
                           <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                           </th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                           <tr key={product.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                       <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                          <FiPackage className="h-5 w-5 text-gray-500" />
                                       </div>
                                    </div>
                                    <div className="ml-4">
                                       <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stock}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.price}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}
                                 >
                                    {product.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                 <div className="flex justify-end gap-2">
                                    <button className="text-indigo-600 hover:text-indigo-900 cursor-pointer">
                                       <FiEdit className="h-5 w-5" />
                                    </button>
                                    <button className="text-red-600 hover:text-red-900 cursor-pointer">
                                       <FiTrash2 className="h-5 w-5" />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Pagination */}
            <div className="bg-white rounded-lg shadow-sm p-4">
               <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                     Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{" "}
                     <span className="font-medium">97</span> results
                  </div>
                  <div className="flex gap-2">
                     <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Previous
                     </button>
                     <button className="px-3 py-1 bg-indigo-600 text-white border border-indigo-600 rounded-md text-sm hover:bg-indigo-700">
                        1
                     </button>
                     <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 cursor-pointer">
                        2
                     </button>
                     <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 cursor-pointer">
                        3
                     </button>
                     <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 cursor-pointer">
                        Next
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </AuthenticatedLayout>
   );
}
