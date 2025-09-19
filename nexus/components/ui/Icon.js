// components/ui/Icon.js
export default function Icon({ name, size = 24, className = "" }) {
   // This is a placeholder. In a real implementation, you'd use an icon library
   return (
      <span className={`inline-block ${className}`} style={{ width: size, height: size }}>
         [{name}]
      </span>
   );
}
