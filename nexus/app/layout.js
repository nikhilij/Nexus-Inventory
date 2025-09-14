export const metadata = {
  title: "Nexus Inventory",
  description: "Inventory management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
