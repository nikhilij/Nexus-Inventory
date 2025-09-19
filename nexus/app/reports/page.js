"use client";

import AuthenticatedLayout from "../../components/AuthenticatedLayout";
import {
   FiDownload,
   FiCalendar,
   FiTrendingUp,
   FiTrendingDown,
   FiBarChart,
   FiPieChart,
   FiFileText,
} from "react-icons/fi";

export default function Reports() {
   const reports = [
      {
         id: 1,
         title: "Monthly Sales Report",
         description: "Comprehensive sales analysis for the current month",
         type: "Sales",
         lastGenerated: "2024-01-15",
         status: "Ready",
         icon: FiTrendingUp,
      },
      {
         id: 2,
         title: "Inventory Status Report",
         description: "Current stock levels and inventory turnover analysis",
         type: "Inventory",
         lastGenerated: "2024-01-14",
         status: "Ready",
         icon: FiBarChart,
      },
      {
         id: 3,
         title: "Supplier Performance",
         description: "Analysis of supplier delivery times and quality metrics",
         type: "Suppliers",
         lastGenerated: "2024-01-13",
         status: "Processing",
         icon: FiPieChart,
      },
      {
         id: 4,
         title: "Financial Summary",
         description: "Revenue, expenses, and profit analysis",
         type: "Financial",
         lastGenerated: "2024-01-12",
         status: "Ready",
         icon: FiFileText,
      },
      {
         id: 5,
         title: "Customer Orders Report",
         description: "Order fulfillment rates and customer satisfaction metrics",
         type: "Orders",
         lastGenerated: "2024-01-11",
         status: "Ready",
         icon: FiTrendingDown,
      },
   ];

   const getStatusColor = (status) => {
      switch (status) {
         case "Ready":
            return "text-green-600 bg-green-100";
         case "Processing":
            return "text-yellow-600 bg-yellow-100";
         case "Failed":
            return "text-red-600 bg-red-100";
         default:
            return "text-gray-600 bg-gray-100";
      }
   };

   const getTypeColor = (type) => {
      switch (type) {
         case "Sales":
            return "text-blue-600 bg-blue-100";
         case "Inventory":
            return "text-green-600 bg-green-100";
         case "Suppliers":
            return "text-purple-600 bg-purple-100";
         case "Financial":
            return "text-orange-600 bg-orange-100";
         case "Orders":
            return "text-indigo-600 bg-indigo-100";
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
                  <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                  <p className="text-gray-600">Generate and download business reports</p>
               </div>
               <div className="flex gap-3">
                  <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                     <FiCalendar className="mr-2 h-5 w-5" />
                     Schedule Report
                  </button>
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                     <FiDownload className="mr-2 h-5 w-5" />
                     Generate Report
                  </button>
               </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="p-2 bg-green-100 rounded-lg">
                        <FiTrendingUp className="h-6 w-6 text-green-600" />
                     </div>
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Reports Generated</p>
                        <p className="text-2xl font-bold text-gray-900">24</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="p-2 bg-blue-100 rounded-lg">
                        <FiBarChart className="h-6 w-6 text-blue-600" />
                     </div>
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">This Month</p>
                        <p className="text-2xl font-bold text-gray-900">8</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="p-2 bg-yellow-100 rounded-lg">
                        <FiFileText className="h-6 w-6 text-yellow-600" />
                     </div>
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Scheduled</p>
                        <p className="text-2xl font-bold text-gray-900">3</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center">
                     <div className="p-2 bg-purple-100 rounded-lg">
                        <FiDownload className="h-6 w-6 text-purple-600" />
                     </div>
                     <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Downloads</p>
                        <p className="text-2xl font-bold text-gray-900">156</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Report Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center mb-4">
                     <div className="p-2 bg-blue-100 rounded-lg">
                        <FiTrendingUp className="h-6 w-6 text-blue-600" />
                     </div>
                     <h3 className="ml-3 text-lg font-semibold text-gray-900">Sales Reports</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Track revenue, orders, and sales performance</p>
                  <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                     Generate Sales Report
                  </button>
               </div>

               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center mb-4">
                     <div className="p-2 bg-green-100 rounded-lg">
                        <FiBarChart className="h-6 w-6 text-green-600" />
                     </div>
                     <h3 className="ml-3 text-lg font-semibold text-gray-900">Inventory Reports</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Monitor stock levels and inventory turnover</p>
                  <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                     Generate Inventory Report
                  </button>
               </div>

               <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center mb-4">
                     <div className="p-2 bg-purple-100 rounded-lg">
                        <FiPieChart className="h-6 w-6 text-purple-600" />
                     </div>
                     <h3 className="ml-3 text-lg font-semibold text-gray-900">Financial Reports</h3>
                  </div>
                  <p className="text-gray-600 mb-4">Analyze revenue, expenses, and profitability</p>
                  <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
                     Generate Financial Report
                  </button>
               </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white rounded-lg shadow-sm">
               <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
               </div>
               <div className="divide-y divide-gray-200">
                  {reports.map((report) => {
                     const Icon = report.icon;
                     return (
                        <div key={report.id} className="px-6 py-4 hover:bg-gray-50">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                 <div className="p-2 bg-gray-100 rounded-lg">
                                    <Icon className="h-5 w-5 text-gray-600" />
                                 </div>
                                 <div className="ml-4">
                                    <h3 className="text-sm font-medium text-gray-900">{report.title}</h3>
                                    <p className="text-sm text-gray-600">{report.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                       <span
                                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(report.type)}`}
                                       >
                                          {report.type}
                                       </span>
                                       <span className="text-xs text-gray-500">
                                          Last generated: {new Date(report.lastGenerated).toLocaleDateString()}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}
                                 >
                                    {report.status}
                                 </span>
                                 {report.status === "Ready" && (
                                    <button className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                       <FiDownload className="mr-2 h-4 w-4" />
                                       Download
                                    </button>
                                 )}
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            {/* Scheduled Reports */}
            <div className="bg-white rounded-lg shadow-sm p-6">
               <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Reports</h2>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                     <div>
                        <h3 className="text-sm font-medium text-gray-900">Weekly Sales Summary</h3>
                        <p className="text-sm text-gray-600">Generated every Monday at 9:00 AM</p>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-green-600 bg-green-100">
                           Active
                        </span>
                        <button className="text-gray-600 hover:text-gray-900">
                           <FiFileText className="h-5 w-5" />
                        </button>
                     </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                     <div>
                        <h3 className="text-sm font-medium text-gray-900">Monthly Inventory Report</h3>
                        <p className="text-sm text-gray-600">Generated on the 1st of every month</p>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-green-600 bg-green-100">
                           Active
                        </span>
                        <button className="text-gray-600 hover:text-gray-900">
                           <FiFileText className="h-5 w-5" />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </AuthenticatedLayout>
   );
}
