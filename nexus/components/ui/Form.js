// components/ui/Form.js
export default function Form({ children, onSubmit, className = "" }) {
   const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit && onSubmit(e);
   };

   return (
      <form onSubmit={handleSubmit} className={className}>
         {children}
      </form>
   );
}
