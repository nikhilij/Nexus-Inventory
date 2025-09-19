"use client";

import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import { FiPlus, FiSearch, FiFilter, FiEye, FiEdit, FiTruck, FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";

export default function Orders() {
   const orders = [
      {
         id: "ORD-001",
         customer: "John Doe",
         items: 3,
         total: "$299.99",
         status: "Processing",
         date: "2024-01-15",
         payment: "Paid",
      },
      {
         id: "ORD-002",
         customer: "Jane Smith",
         items: 1,
         total: "$79.99",
         status: "Shipped",
         date: "2024-01-14",
         payment: "Paid",
      },
      {
         id: "ORD-003",
         customer: "Bob Johnson",
         items: 5,
         total: "$549.99",
         status: "Delivered",
         date: "2024-01-13",
         payment: "Paid",
      },
      {
         id: "ORD-004",
         customer: "Alice Brown",
         items: 2,
         total: "$149.99",
         status: "Pending",
         date: "2024-01-12",
         payment: "Pending",
      },
      {
         id: "ORD-005",
         customer: "Charlie Wilson",
         items: 4,
         total: "$399.99",
         status: "Cancelled",
         date: "2024-01-11",
         payment: "Refunded",
      },
   ];

   const getStatusIcon = (status) => {
      switch (status) {
         case "Processing":
            return <FiClock className="h-5 w-5 text-blue-500" />;
         case "Shipped":
            return <FiTruck className="h-5 w-5 text-orange-500" />;
         case "Delivered":
            return <FiCheckCircle className="h-5 w-5 text-green-500" />;
         case "Pending":
            return <FiClock className="h-5 w-5 text-yellow-500" />;
         case "Cancelled":
            return <FiXCircle className="h-5 w-5 text-red-500" />;
         default:
            return <FiClock className="h-5 w-5 text-gray-500" />;
      }
   };

   const getStatusColor = (status) => {
      switch (status) {
         case "Processing":
            return "text-blue-600 bg-blue-100";
         case "Shipped":
            return "text-orange-600 bg-orange-100";
         case "Delivered":
            return "text-green-600 bg-green-100";
         case "Pending":
            return "text-yellow-600 bg-yellow-100";
         case "Cancelled":
            return "text-red-600 bg-red-100";
         default:
            return "text-gray-600 bg-gray-100";
      }
   };

   const getPaymentColor = (payment) => {
      switch (payment) {
         case "Paid":
            return "text-green-600 bg-green-100";
         case "Pending":
            return "text-yellow-600 bg-yellow-100";
         case "Refunded":
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
                  <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                  <p className="text-gray-600">Manage customer orders and fulfillment</p>
               </div>
               <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <FiPlus className="mr-2 h-5 w-5" />
                  New Order
               </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="p-2 bg-blue-100 rounded-lg">
                        <FiClock className="h-6 w-6 text-blue-600" />
                     </div>
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Processing</p>
                        <p className="text-2xl font-bold text-gray-900">1</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="p-2 bg-orange-100 rounded-lg">
                        <FiTruck className="h-6 w-6 text-orange-600" />
                     </div>
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Shipped</p>
                        <p className="text-2xl font-bold text-gray-900">1</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="p-2 bg-green-100 rounded-lg">
                        <FiCheckCircle className="h-6 w-6 text-green-600" />
                     </div>
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Delivered</p>
                        <p className="text-2xl font-bold text-gray-900">1</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="p-2 bg-gray-100 rounded-lg">
                        <FiCheckCircle className="h-6 w-6 text-gray-600" />
                     </div>
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">$1,479.95</p>
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
                           placeholder="Search orders..."
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

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                        <tr>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Order ID
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Items
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment
                           </th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                           </th>
                           <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                           </th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order) => (
                           <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                 {order.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.items}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.total}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <div className="flex items-center">
                                    {getStatusIcon(order.status)}
                                    <span
                                       className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}
                                    >
                                       {order.status}
                                    </span>
                                 </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentColor(order.payment)}`}
                                 >
                                    {order.payment}
                                 </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                 {new Date(order.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                 <div className="flex justify-end gap-2">
                                    <button className="text-indigo-600 hover:text-indigo-900">
                                       <FiEye className="h-5 w-5" />
                                    </button>
                                    <button className="text-gray-600 hover:text-gray-900">
                                       <FiEdit className="h-5 w-5" />
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
                     <span className="font-medium">25</span> results
                  </div>
                  <div className="flex gap-2">
                     <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Previous
                     </button>
                     <button className="px-3 py-1 bg-indigo-600 text-white border border-indigo-600 rounded-md text-sm hover:bg-indigo-700">
                        1
                     </button>
                     <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">2</button>
                     <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">3</button>
                     <button className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                        Next
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </AuthenticatedLayout>
   );
}
