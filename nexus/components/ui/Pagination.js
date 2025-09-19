// components/ui/Pagination.js
export default function Pagination({ currentPage, totalPages, onPageChange }) {
   const pages = [];
   for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
   }

   return (
      <div className="flex items-center justify-center space-x-2 mt-4">
         <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
         >
            Previous
         </button>
         {pages.map((page) => (
            <button
               key={page}
               onClick={() => onPageChange(page)}
               className={`px-3 py-2 border rounded-md ${
                  page === currentPage ? "bg-blue-500 text-white border-blue-500" : "border-gray-300 hover:bg-gray-50"
               }`}
            >
               {page}
            </button>
         ))}
         <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
         >
            Next
         </button>
      </div>
   );
}
