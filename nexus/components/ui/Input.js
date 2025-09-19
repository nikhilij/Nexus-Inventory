// components/ui/Input.js
export default function Input({ type = "text", placeholder, value, onChange, disabled = false, error }) {
   return (
      <div>
         <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
               error ? "border-red-500" : "border-gray-300"
            } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
         />
         {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
   );
}
