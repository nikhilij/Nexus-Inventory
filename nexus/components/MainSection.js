import Link from 'next/link';
import {
  HiArrowRight,
  HiCheck,
  HiClock,
  HiSparkles,
  HiCube,
  HiChartBar,
  HiTruck,
  HiCog,
  HiShoppingCart,
  HiUsers,
  HiRocketLaunch,
  HiPlay,
} from 'react-icons/hi2';
import { HiClipboardList } from 'react-icons/hi';
import { HiShieldCheck } from 'react-icons/hi2';

export default function MainSection() {
  return (
    <main aria-labelledby="hero-heading" className="relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-teal-50/30 animate-gradient-xy" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-20">
        {/* Hero */}
        <section id="hero" aria-labelledby="hero-heading" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 text-blue-700 text-sm font-medium animate-float">
                <HiSparkles className="w-4 h-4" />
                <span>AI-Powered Inventory Management</span>
              </div>

              <h1 id="hero-heading" className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight">
                <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">Inventory software</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent animate-gradient-x">that keeps your business</span>
                <br />
                <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">in stock and in control</span>
              </h1>

              <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
                Track items across warehouses, sell on multiple channels, automate reorders, and invoice customers — all from a single dashboard built for growing teams.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg">
                <HiRocketLaunch className="w-6 h-6 group-hover:animate-bounce" />
                <span>Start free trial</span>
                <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>

              <Link href="/demo" className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-slate-50 to-white border-2 border-slate-200 text-slate-800 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 transform hover:scale-105 transition-all duration-300 font-semibold text-lg shadow-sm hover:shadow-md">
                <HiPlay className="w-6 h-6 group-hover:text-blue-600 transition-colors duration-200" />
                <span>Watch demo</span>
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 ring-1 ring-green-200/50 text-sm font-medium">
                <HiCheck className="w-4 h-4" />
                <span>No credit card required</span>
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                <HiUsers className="w-4 h-4" />
                <span>Join 10,000+ businesses</span>
              </div>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6">
              <li className="flex items-center gap-3 text-slate-700">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                  <HiCheck className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">Multi-channel selling</span>
              </li>
              <li className="flex items-center gap-3 text-slate-700">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center">
                  <HiClock className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">Real-time sync</span>
              </li>
              <li className="flex items-center gap-3 text-slate-700">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 flex items-center justify-center">
                  <HiShieldCheck className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">Enterprise security</span>
              </li>
              <li className="flex items-center gap-3 text-slate-700">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 flex items-center justify-center">
                  <HiCog className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">API integrations</span>
              </li>
            </ul>
          </div>

          <div className="relative lg:pl-8">
            {/* Floating Background Elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl opacity-20 animate-float" />
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full opacity-20 animate-bounce-slow" />

            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 border border-slate-200/50 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-teal-500/5" />

              {/* Mock Dashboard */}
              <div className="relative p-6">
                <div className="h-80 lg:h-96 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/50 overflow-hidden">
                  {/* Dashboard Header */}
                  <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <HiChartBar className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Dashboard</div>
                          <div className="text-xs text-slate-500">Real-time overview</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Content */}
                  <div className="p-6 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200/50">
                        <HiCube className="w-6 h-6 text-blue-600 mb-2" />
                        <div className="text-2xl font-bold text-slate-900">2,847</div>
                        <div className="text-xs text-slate-600">Products</div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200/50">
                        <HiShoppingCart className="w-6 h-6 text-emerald-600 mb-2" />
                        <div className="text-2xl font-bold text-slate-900">$24.8K</div>
                        <div className="text-xs text-slate-600">Sales</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200/50">
                        <HiTruck className="w-6 h-6 text-purple-600 mb-2" />
                        <div className="text-2xl font-bold text-slate-900">156</div>
                        <div className="text-xs text-slate-600">Orders</div>
                      </div>
                    </div>

                    {/* Activity List */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <div className="flex-1 text-sm text-slate-700">New order #2847 received</div>
                        <div className="text-xs text-slate-400">2m ago</div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <div className="flex-1 text-sm text-slate-700">Inventory sync completed</div>
                        <div className="text-xs text-slate-400">5m ago</div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <div className="flex-1 text-sm text-slate-700">Low stock alert: SKU-1234</div>
                        <div className="text-xs text-slate-400">8m ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="p-6 border-t border-slate-200/50 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-medium text-slate-600">Trusted by</div>
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">A</div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">B</div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">C</div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">+</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-700">14-day free trial</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value highlights */}
        <section aria-labelledby="values-heading" className="mt-10">
          <h2 id="values-heading" className="text-2xl font-semibold mb-6 text-slate-800">
            What you can do with Nexus
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-xl border shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <HiClipboardList className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-lg">Manage orders & invoices</div>
                  <p className="text-sm text-slate-600 mt-1">Convert sales into invoices, record payments, and keep AR in sync.</p>
                </div>
              </div>
            </div>

            <div className="p-5 bg-white rounded-xl border shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <HiCog className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-lg">Automate procurement</div>
                  <p className="text-sm text-slate-600 mt-1">Auto-generate POs when stock dips below thresholds.</p>
                </div>
              </div>
            </div>

            <div className="p-5 bg-white rounded-xl border shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <HiTruck className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-lg">Ship & track</div>
                  <p className="text-sm text-slate-600 mt-1">Integrate with carriers, print labels, and update statuses automatically.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section aria-labelledby="features-heading" className="mt-8">
          <h2 id="features-heading" className="text-2xl font-semibold mb-6 text-slate-800">
            Key features
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Order & Sales Management',
                desc: 'Create sales orders, convert to invoices, manage returns and backorders.',
              },
              {
                title: 'Purchase & Supplier Workflows',
                desc: 'Raise POs, track lead times, and reconcile receipts with orders.',
              },
              {
                title: 'Barcode & Mobile Scanning',
                desc: 'Speed up receiving, picking, and stocktakes with a mobile-friendly scanner UI.',
              },
              {
                title: 'Reports & Analytics',
                desc: 'Inventory valuation, movement reports, and custom exports.',
              },
              {
                title: 'Multi-Channel & Integrations',
                desc: 'Connect online stores, accounting systems, and shipping providers.',
              },
              {
                title: 'Security & Compliance',
                desc: 'Audit trails, role-based access, and controlled permissions.',
              },
            ].map((f) => (
              <article
                key={f.title}
                className="p-5 bg-white rounded-xl border hover:shadow-lg transition transform hover:-translate-y-0.5"
              >
                <h3 className="text-lg font-medium">{f.title}</h3>
                <p className="text-sm text-slate-600 mt-2">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Integrations & Pricing */}
        <section className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4 text-slate-800">Connect your stack</h2>
            <p className="text-slate-600 mb-4">
              Link ecommerce platforms, accounting software, barcode hardware, and shipping services to keep stock
              and orders synchronized in real time.
            </p>

            <div className="flex flex-wrap gap-3">
              {['Shopify', 'QuickBooks', 'WooCommerce', 'Xero', 'FedEx'].map((name) => (
                <div
                  key={name}
                  className="px-4 py-2 bg-slate-50 border rounded-full text-sm text-slate-700 shadow-sm"
                >
                  {name}
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Link href="/integrations" className="text-blue-600 hover:underline">
                See available integrations →
              </Link>
            </div>
          </div>

          <aside className="p-5 bg-gradient-to-br from-white to-slate-50 rounded-xl border shadow-sm">
            <h3 className="text-lg font-semibold">Plans to match your growth</h3>
            <p className="text-sm text-slate-600 mt-2">Choose a tier that fits your team and scale when you are ready.</p>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="p-3 bg-white rounded-lg border flex items-center justify-between">
                <div>
                  <div className="font-medium">Starter</div>
                  <div className="text-sm text-slate-500">Small teams · Basic inventory</div>
                </div>
                <div className="text-sm font-semibold">$29/mo</div>
              </div>

              <div className="p-3 bg-white rounded-lg border flex items-center justify-between ring-2 ring-blue-50">
                <div>
                  <div className="font-medium">Growth</div>
                  <div className="text-sm text-slate-500">Multi-warehouse · Automations</div>
                </div>
                <div className="text-sm font-semibold">$99/mo</div>
              </div>

              <div className="p-3 bg-white rounded-lg border flex items-center justify-between">
                <div>
                  <div className="font-medium">Enterprise</div>
                  <div className="text-sm text-slate-500">Custom SLAs · SSO</div>
                </div>
                <div className="text-sm font-semibold">Contact</div>
              </div>
            </div>

            <div className="mt-4">
              <Link href="/pricing" className="inline-block text-sm text-blue-600 hover:underline">
                Compare plans →
              </Link>
            </div>
          </aside>
        </section>

        {/* Trust & CTA */}
        <section className="mt-10 bg-gradient-to-r from-slate-50 to-white rounded-2xl p-6 border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <blockquote className="italic text-slate-700 max-w-2xl">
              &ldquo;Nexus helped us reduce stock discrepancies and cut fulfillment times in half.&rdquo; — Operations Manager
            </blockquote>

            <div className="flex gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
              >
                Start free trial
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 transition"
              >
                Schedule demo
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="mt-10">
          <h2 id="faq-heading" className="text-2xl font-semibold mb-4 text-slate-800">
            FAQ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border">
              <dt className="font-medium">Do I need to install anything?</dt>
              <dd className="text-slate-600 mt-2">No — Nexus is web-first. Mobile scanning works with the web UI or companion apps.</dd>
            </div>
            <div className="p-4 bg-white rounded-xl border">
              <dt className="font-medium">Can I migrate data from my current system?</dt>
              <dd className="text-slate-600 mt-2">Yes — CSV import and migration services are available for common platforms and ERPs.</dd>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}