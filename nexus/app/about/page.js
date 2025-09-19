export const metadata = {
  title: 'About — Nexus Inventory',
  description: 'Learn about Nexus Inventory — our mission, team, customers, and how we help businesses automate inventory and reduce stockouts.'
};

export default function AboutPage() {
  return (
    <main className="bg-gray-50 text-gray-800 font-sans">
      <section className="py-12 px-6 text-center bg-white shadow-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Nexus Inventory — Smarter Inventory, Smoother Operations</h1>
        <p className="text-lg text-gray-600 mb-2">Real-time stock control, AI-driven forecasts, and automation that scales with your business.</p>
        <p className="text-sm text-gray-500 mb-6">Multi-warehouse • Automated POs • Enterprise-ready security</p>
        <div className="space-x-4">
          <a href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Start free trial</a>
          <a href="/contact" className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Request demo</a>
        </div>
      </section>

      <section className="py-12 px-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our mission</h2>
        <p className="text-gray-600">We help operations teams eliminate stockouts, reduce waste, and reclaim time using intelligent automation.</p>
      </section>

      <section className="py-12 px-6 bg-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Company timeline</h2>
        <p className="text-gray-600">Founding, milestones, customers and product launches — include a timeline here.</p>
      </section>

      <section className="py-12 px-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Leadership</h2>
        <p className="text-gray-600">Executive bios and team information.</p>
      </section>

      <section className="py-12 px-6 bg-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Metrics & traction</h2>
        <p className="text-gray-600">Trusted by 500+ operations • 99.99% uptime • Average customer reduces stockouts by 32%.</p>
      </section>

      <section className="py-12 px-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Customers & case studies</h2>
        <p className="text-gray-600">Show logos and link to case studies.</p>
      </section>

      <section className="py-12 px-6 bg-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Careers & culture</h2>
        <p className="text-gray-600">We’re remote-first, customer-obsessed, and invest in professional growth. <a href="/careers" className="text-blue-600 hover:underline">See open roles</a></p>
      </section>
    </main>
  );
}
