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
  HiClipboardList,
  HiUsers,
  HiShield,
  HiRocketLaunch,
  HiPlay,
} from 'react-icons/hi2';

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
                  <HiShield className="w-4 h-4 text-white" />
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
        <section aria-labelledby="values-heading" className="mb-16">
          <h2 id="values-heading" className="text-3xl sm:text-4xl font-bold mb-12 text-center">
            <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">What you can do with</span>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent"> Nexus</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="group p-6 bg-gradient-to-br from-white via-blue-50/30 to-white rounded-2xl border border-blue-200/50 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <HiClipboardList className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Manage orders & invoices</h3>
                  <p className="text-slate-600 leading-relaxed">Convert sales into invoices, record payments, and keep AR in sync.</p>
                </div>
              </div>
            </div>

            <div className="group p-6 bg-gradient-to-br from-white via-emerald-50/30 to-white rounded-2xl border border-emerald-200/50 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <HiCog className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Automate procurement</h3>
                  <p className="text-slate-600 leading-relaxed">Auto-generate POs when stock dips below thresholds.</p>
                </div>
              </div>
            </div>

            <div className="group p-6 bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl border border-purple-200/50 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <HiTruck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Ship & track</h3>
                  <p className="text-slate-600 leading-relaxed">Integrate with carriers, print labels, and update statuses automatically.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section aria-labelledby="features-heading" className="mb-16">
          <h2 id="features-heading" className="text-3xl sm:text-4xl font-bold mb-12 text-center">
            <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">Key</span>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent"> features</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Order & Sales Management',
                desc: 'Create sales orders, convert to invoices, manage returns and backorders.',
                icon: HiShoppingCart,
                gradient: 'from-blue-500 to-blue-600',
              },
              {
                title: 'Purchase & Supplier Workflows',
                desc: 'Raise POs, track lead times, and reconcile receipts with orders.',
                icon: HiClipboardList,
                gradient: 'from-emerald-500 to-emerald-600',
              },
              {
                title: 'Barcode & Mobile Scanning',
                desc: 'Speed up receiving, picking, and stocktakes with a mobile-friendly scanner UI.',
                icon: HiCube,
                gradient: 'from-purple-500 to-purple-600',
              },
              {
                title: 'Reports & Analytics',
                desc: 'Inventory valuation, movement reports, and custom exports.',
                icon: HiChartBar,
                gradient: 'from-teal-500 to-teal-600',
              },
              {
                title: 'Multi-Channel & Integrations',
                desc: 'Connect online stores, accounting systems, and shipping providers.',
                icon: HiCog,
                gradient: 'from-orange-500 to-orange-600',
              },
              {
                title: 'Security & Compliance',
                desc: 'Audit trails, role-based access, and controlled permissions.',
                icon: HiShield,
                gradient: 'from-pink-500 to-pink-600',
              },
            ].map((feature) => {
              const IconComponent = feature.icon;
              return (
                <article key={feature.title} className="group p-6 bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 bg-gradient-to-r ${feature.gradient} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Integrations & Pricing */}
        <section className="mb-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold mb-6">
              <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">Connect your</span>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent"> stack</span>
            </h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Link ecommerce platforms, accounting software, barcode hardware, and shipping services to keep stock and orders synchronized in real time.
            </p>

            <div className="flex flex-wrap gap-3 mb-6">
              {['Shopify', 'QuickBooks', 'WooCommerce', 'Xero', 'FedEx'].map((name) => (
                <div key={name} className="px-4 py-2 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
                  {name}
                </div>
              ))}
            </div>

            <div>
              <Link href="/integrations" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                See available integrations
                <HiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <aside className="p-6 bg-gradient-to-br from-white via-slate-50/50 to-white rounded-2xl border border-slate-200/50 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Plans to match your growth</h3>
            <p className="text-slate-600 mb-6">Choose a tier that fits your team and scale when you are ready.</p>

            <div className="space-y-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow duration-200">
                <div>
                  <div className="font-semibold text-slate-900">Starter</div>
                  <div className="text-sm text-slate-500">Small teams · Basic inventory</div>
                </div>
                <div className="text-lg font-bold text-slate-900">$29/mo</div>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 flex items-center justify-between ring-2 ring-blue-200/50">
                <div>
                  <div className="font-semibold text-slate-900">Growth</div>
                  <div className="text-sm text-slate-600">Multi-warehouse · Automations</div>
                </div>
                <div className="text-lg font-bold text-blue-600">$99/mo</div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow duration-200">
                <div>
                  <div className="font-semibold text-slate-900">Enterprise</div>
                  <div className="text-sm text-slate-500">Custom SLAs · SSO</div>
                </div>
                <div className="text-lg font-bold text-slate-900">Contact</div>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/pricing" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                Compare plans
                <HiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </aside>
        </section>

        {/* Trust & CTA */}
        <section className="mb-16 bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 rounded-3xl p-8 border border-slate-200/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <blockquote className="italic text-lg text-slate-700 max-w-2xl leading-relaxed">
              "Nexus helped us reduce stock discrepancies and cut fulfillment times in half." 
              <span className="block mt-2 text-base font-medium not-italic text-slate-600">— Operations Manager</span>
            </blockquote>

            <div className="flex gap-4">
              <Link href="/signup" className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold">
                <HiRocketLaunch className="w-5 h-5 group-hover:animate-bounce" />
                Start free trial
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transform hover:scale-105 transition-all duration-300 font-semibold shadow-md hover:shadow-lg">
                <HiPlay className="w-5 h-5" />
                Schedule demo
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-3xl sm:text-4xl font-bold mb-12 text-center">
            <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">Frequently asked</span>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent"> questions</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <dt className="font-bold text-lg text-slate-900 mb-3">Do I need to install anything?</dt>
              <dd className="text-slate-600 leading-relaxed">No — Nexus is web-first. Mobile scanning works with the web UI or companion apps.</dd>
            </div>
            <div className="p-6 bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <dt className="font-bold text-lg text-slate-900 mb-3">Can I migrate data from my current system?</dt>
              <dd className="text-slate-600 leading-relaxed">Yes — CSV import and migration services are available for common platforms and ERPs.</dd>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20"          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20"

            <div className="flex items-center gap-6 pt-4">

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 ring-1 ring-green-200/50 text-sm font-medium">        >        >

                <HiCheck className="w-4 h-4" />

                <span>No credit card required</span>          <div className="space-y-8">          <div className="space-y-8">

              </div>

              <div className="inline-flex items-center gap-2 text-sm text-slate-500">            <div className="space-y-6">            <div className="space-y-6">

                <HiUsers className="w-4 h-4" />

                <span>Join 10,000+ businesses</span>              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 text-blue-700 text-sm font-medium animate-float">              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 text-blue-700 text-sm font-medium animate-float">

              </div>

            </div>                <HiSparkles className="w-4 h-4" />                <HiSparkles className="w-4 h-4" />



            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6">                <span>AI-Powered Inventory Management</span>                <span>AI-Powered Inventory Management</span>

              <li className="flex items-center gap-3 text-slate-700">

                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">              </div>              </div>

                  <HiCheck className="w-4 h-4 text-white" />

                </div>                            

                <span className="font-medium">Multi-channel selling</span>

              </li>              <h1              <h1



              <li className="flex items-center gap-3 text-slate-700">                id="hero-heading"                id="hero-heading"

                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center">

                  <HiClock className="w-4 h-4 text-white" />                className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight"                className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight"

                </div>

                <span className="font-medium">Real-time sync</span>              >              >

              </li>

                <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">                <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">

              <li className="flex items-center gap-3 text-slate-700">

                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 flex items-center justify-center">                  Inventory software                  Inventory software

                  <HiShield className="w-4 h-4 text-white" />

                </div>                </span>                </span>

                <span className="font-medium">Enterprise security</span>

              </li>                <br />                <br />



              <li className="flex items-center gap-3 text-slate-700">                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent animate-gradient-x">                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent animate-gradient-x">

                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 flex items-center justify-center">

                  <HiCog className="w-4 h-4 text-white" />                  that keeps your business                  that keeps your business

                </div>

                <span className="font-medium">API integrations</span>                </span>                </span>

              </li>

            </ul>                <br />                <br />

          </div>

                <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">                <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">

          <div className="relative lg:pl-8">

            {/* Floating Background Elements */}                  in stock and in control                  in stock and in control

            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl opacity-20 animate-float" />

            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full opacity-20 animate-bounce-slow" />                </span>                </span>



            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 border border-slate-200/50 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105">              </h1>              </h1>

              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-teal-500/5" />

                            

              {/* Mock Dashboard */}

              <div className="relative p-6">              <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">              <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">

                <div className="h-80 lg:h-96 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/50 overflow-hidden">

                  {/* Dashboard Header */}                Track items across warehouses, sell on multiple channels, automate reorders, and                Track items across warehouses, sell on multiple channels, automate reorders, and

                  <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/50 p-4">

                    <div className="flex items-center justify-between">                invoice customers — all from a single dashboard built for growing teams.                invoice customers — all from a single dashboard built for growing teams.

                      <div className="flex items-center gap-3">

                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">              </p>              </p>

                          <HiChartBar className="w-4 h-4 text-white" />

                        </div>            </div>            </div>

                        <div>

                          <div className="text-sm font-semibold text-slate-900">Dashboard</div>

                          <div className="text-xs text-slate-500">Real-time overview</div>

                        </div>            <div className="flex flex-col sm:flex-row gap-4">            <div className="flex flex-col sm:flex-row gap-4">

                      </div>

                      <div className="flex gap-2">              <Link              <Link

                        <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />

                        <div className="w-3 h-3 rounded-full bg-yellow-400" />                href="/signup"                href="/signup"

                        <div className="w-3 h-3 rounded-full bg-green-400" />

                      </div>                className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg"                className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold text-lg"

                    </div>

                  </div>              >              >



                  {/* Dashboard Content */}                <HiRocketLaunch className="w-6 h-6 group-hover:animate-bounce" />                <HiRocketLaunch className="w-6 h-6 group-hover:animate-bounce" />

                  <div className="p-6 space-y-6">

                    {/* Stats Cards */}                <span>Start free trial</span>                <span>Start free trial</span>

                    <div className="grid grid-cols-3 gap-4">

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200/50">                <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />                <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />

                        <HiCube className="w-6 h-6 text-blue-600 mb-2" />

                        <div className="text-2xl font-bold text-slate-900">2,847</div>              </Link>              </Link>

                        <div className="text-xs text-slate-600">Products</div>

                      </div>



                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200/50">              <Link              <Link

                        <HiShoppingCart className="w-6 h-6 text-emerald-600 mb-2" />

                        <div className="text-2xl font-bold text-slate-900">$24.8K</div>                href="/demo"                href="/demo"

                        <div className="text-xs text-slate-600">Sales</div>

                      </div>                className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-slate-50 to-white border-2 border-slate-200 text-slate-800 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 transform hover:scale-105 transition-all duration-300 font-semibold text-lg shadow-sm hover:shadow-md"                className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-slate-50 to-white border-2 border-slate-200 text-slate-800 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 transform hover:scale-105 transition-all duration-300 font-semibold text-lg shadow-sm hover:shadow-md"



The file continues...              >              >

                <HiPlay className="w-6 h-6 group-hover:text-blue-600 transition-colors duration-200" />                <HiPlay className="w-6 h-6 group-hover:text-blue-600 transition-colors duration-200" />

                <span>Watch demo</span>                <span>Watch demo</span>

              </Link>              </Link>

            </div>            </div>



            <div className="flex items-center gap-6 pt-4">            <div className="flex items-center gap-6 pt-4">

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 ring-1 ring-green-200/50 text-sm font-medium">              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 ring-1 ring-green-200/50 text-sm font-medium">

                <HiCheck className="w-4 h-4" />                <HiCheck className="w-4 h-4" />

                <span>No credit card required</span>                <span>No credit card required</span>

              </div>              </div>

              <div className="inline-flex items-center gap-2 text-sm text-slate-500">              <div className="inline-flex items-center gap-2 text-sm text-slate-500">

                <HiUsers className="w-4 h-4" />                <HiUsers className="w-4 h-4" />

                <span>Join 10,000+ businesses</span>                <span>Join 10,000+ businesses</span>

              </div>              </div>

            </div>            </div>



            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6">            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6">

              <li className="flex items-center gap-3 text-slate-700">              <li className="flex items-center gap-3 text-slate-700">

                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">

                  <HiCheck className="w-4 h-4 text-white" />                  <HiCheck className="w-4 h-4 text-white" />

                </div>                </div>

                <span className="font-medium">Multi-channel selling</span>                <span className="font-medium">Multi-channel selling</span>

              </li>              </li>

              <li className="flex items-center gap-3 text-slate-700">              <li className="flex items-center gap-3 text-slate-700">

                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center">                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center">

                  <HiClock className="w-4 h-4 text-white" />                  <HiClock className="w-4 h-4 text-white" />

                </div>                </div>

                <span className="font-medium">Real-time sync</span>                <span className="font-medium">Real-time sync</span>

              </li>              </li>

              <li className="flex items-center gap-3 text-slate-700">              <li className="flex items-center gap-3 text-slate-700">

                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 flex items-center justify-center">                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 flex items-center justify-center">

                  <HiShield className="w-4 h-4 text-white" />                  <HiShield className="w-4 h-4 text-white" />

                </div>                </div>

                <span className="font-medium">Enterprise security</span>                <span className="font-medium">Enterprise security</span>

              </li>              </li>

              <li className="flex items-center gap-3 text-slate-700">              <li className="flex items-center gap-3 text-slate-700">

                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 flex items-center justify-center">                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-teal-400 to-teal-500 flex items-center justify-center">

                  <HiCog className="w-4 h-4 text-white" />                  <HiCog className="w-4 h-4 text-white" />

                </div>                </div>

                <span className="font-medium">API integrations</span>                <span className="font-medium">API integrations</span>

              </li>              </li>

            </ul>            </ul>

          </div>          </div>



          <div className="relative lg:pl-8">          <div className="relative lg:pl-8">

            {/* Floating Background Elements */}            {/* Floating Background Elements */}

            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl opacity-20 animate-float"></div>            <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl opacity-20 animate-float"></div>

            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full opacity-20 animate-bounce-slow"></div>            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full opacity-20 animate-bounce-slow"></div>

                        

            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 border border-slate-200/50 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105">            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 border border-slate-200/50 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105">

              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-teal-500/5"></div>              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-teal-500/5"></div>

                            

              {/* Mock Dashboard */}              {/* Mock Dashboard */}

              <div className="relative p-6">              <div className="relative p-6">

                <div className="h-80 lg:h-96 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/50 overflow-hidden">                <div className="h-80 lg:h-96 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/50 overflow-hidden">

                  {/* Dashboard Header */}                  {/* Dashboard Header */}

                  <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/50 p-4">                  <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/50 p-4">

                    <div className="flex items-center justify-between">                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-3">                      <div className="flex items-center gap-3">

                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">

                          <HiChartBar className="w-4 h-4 text-white" />                          <HiChartBar className="w-4 h-4 text-white" />

                        </div>                        </div>

                        <div>                        <div>

                          <div className="text-sm font-semibold text-slate-900">Dashboard</div>                          <div className="text-sm font-semibold text-slate-900">Dashboard</div>

                          <div className="text-xs text-slate-500">Real-time overview</div>                          <div className="text-xs text-slate-500">Real-time overview</div>

                        </div>                        </div>

                      </div>                      </div>

                      <div className="flex gap-2">                      <div className="flex gap-2">

                        <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse"></div>                        <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse"></div>

                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>

                        <div className="w-3 h-3 rounded-full bg-green-400"></div>                        <div className="w-3 h-3 rounded-full bg-green-400"></div>

                      </div>                      </div>

                    </div>                    </div>

                  </div>                  </div>

                                    

                  {/* Dashboard Content */}                  {/* Dashboard Content */}

                  <div className="p-6 space-y-6">                  <div className="p-6 space-y-6">

                    {/* Stats Cards */}                    {/* Stats Cards */}

                    <div className="grid grid-cols-3 gap-4">                    <div className="grid grid-cols-3 gap-4">

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200/50">                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200/50">

                        <HiCube className="w-6 h-6 text-blue-600 mb-2" />                        <HiCube className="w-6 h-6 text-blue-600 mb-2" />

                        <div className="text-2xl font-bold text-slate-900">2,847</div>                        <div className="text-2xl font-bold text-slate-900">2,847</div>

                        <div className="text-xs text-slate-600">Products</div>                        <div className="text-xs text-slate-600">Products</div>

                      </div>                      </div>

                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200/50">                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200/50">

                        <HiShoppingCart className="w-6 h-6 text-emerald-600 mb-2" />                        <HiShoppingCart className="w-6 h-6 text-emerald-600 mb-2" />

                        <div className="text-2xl font-bold text-slate-900">$24.8K</div>                        <div className="text-2xl font-bold text-slate-900">$24.8K</div>

                        <div className="text-xs text-slate-600">Sales</div>                        <div className="text-xs text-slate-600">Sales</div>

                      </div>                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200/50">                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200/50">

                        <HiTruck className="w-6 h-6 text-purple-600 mb-2" />                        <HiTruck className="w-6 h-6 text-purple-600 mb-2" />

                        <div className="text-2xl font-bold text-slate-900">156</div>                        <div className="text-2xl font-bold text-slate-900">156</div>

                        <div className="text-xs text-slate-600">Orders</div>                        <div className="text-xs text-slate-600">Orders</div>

                      </div>                      </div>

                    </div>                    </div>

                                        

                    {/* Activity List */}                    {/* Activity List */}

                    <div className="space-y-3">                    <div className="space-y-3">

                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">

                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>

                        <div className="flex-1 text-sm text-slate-700">New order #2847 received</div>                        <div className="flex-1 text-sm text-slate-700">New order #2847 received</div>

                        <div className="text-xs text-slate-400">2m ago</div>                        <div className="text-xs text-slate-400">2m ago</div>

                      </div>                      </div>

                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">

                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>

                        <div className="flex-1 text-sm text-slate-700">Inventory sync completed</div>                        <div className="flex-1 text-sm text-slate-700">Inventory sync completed</div>

                        <div className="text-xs text-slate-400">5m ago</div>                        <div className="text-xs text-slate-400">5m ago</div>

                      </div>                      </div>

                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">

                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>

                        <div className="flex-1 text-sm text-slate-700">Low stock alert: SKU-1234</div>                        <div className="flex-1 text-sm text-slate-700">Low stock alert: SKU-1234</div>

                        <div className="text-xs text-slate-400">8m ago</div>                        <div className="text-xs text-slate-400">8m ago</div>

                      </div>                      </div>

                    </div>                    </div>

                  </div>                  </div>

                </div>                </div>

              </div>              </div>

                            

              {/* Trust Indicators */}              {/* Trust Indicators */}

              <div className="p-6 border-t border-slate-200/50 bg-gradient-to-r from-slate-50 to-white">              <div className="p-6 border-t border-slate-200/50 bg-gradient-to-r from-slate-50 to-white">

                <div className="flex items-center justify-between">                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">                  <div className="flex items-center gap-3">

                    <div className="text-xs font-medium text-slate-600">Trusted by</div>                    <div className="text-xs font-medium text-slate-600">Trusted by</div>

                    <div className="flex -space-x-2">                    <div className="flex -space-x-2">

                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">A</div>                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">A</div>

                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">B</div>                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">B</div>

                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">C</div>                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">C</div>

                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">+</div>                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">+</div>

                    </div>                    </div>

                  </div>                  </div>

                  <div className="text-sm font-medium text-slate-700">14-day free trial</div>                  <div className="text-sm font-medium text-slate-700">14-day free trial</div>

                </div>                </div>

              </div>              </div>

            </div>            </div>

          </div>          </div>

        </section>        </section>

                </div>

        {/* Value highlights */}              </div>

        <section aria-labelledby="values-heading" className="mb-16">              <div className="text-sm text-slate-500">14-day free trial</div>

          <h2 id="values-heading" className="text-3xl sm:text-4xl font-bold mb-12 text-center">            </div>

            <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">          </div>

              What you can do with        </div>

            </span>      </section>

            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent"> Nexus</span>

          </h2>      {/* Value highlights */}

      <section aria-labelledby="values-heading" className="mt-10">

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">        <h2 id="values-heading" className="text-2xl font-semibold mb-6 text-slate-800">

            <div className="group p-6 bg-gradient-to-br from-white via-blue-50/30 to-white rounded-2xl border border-blue-200/50 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">          What you can do with Nexus

              <div className="flex items-start gap-4">        </h2>

                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-300">

                  <HiClipboardList className="w-6 h-6 text-white" />        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                </div>          <div className="p-5 bg-white rounded-xl border shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">

                <div>            <div className="flex items-start gap-3">

                  <h3 className="font-bold text-lg text-slate-900 mb-2">Manage orders & invoices</h3>              <div className="p-2 bg-blue-50 rounded-lg">

                  <p className="text-slate-600 leading-relaxed">Convert sales into invoices, record payments, and keep AR in sync.</p>                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                </div>                  <path d="M3 7h18M3 12h12M3 17h18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

              </div>                </svg>

            </div>              </div>

              <div>

            <div className="group p-6 bg-gradient-to-br from-white via-emerald-50/30 to-white rounded-2xl border border-emerald-200/50 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">                <div className="font-semibold text-lg">Manage orders & invoices</div>

              <div className="flex items-start gap-4">                <p className="text-sm text-slate-600 mt-1">Convert sales into invoices, record payments, and keep AR in sync.</p>

                <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-300">              </div>

                  <HiCog className="w-6 h-6 text-white" />            </div>

                </div>          </div>

                <div>

                  <h3 className="font-bold text-lg text-slate-900 mb-2">Automate procurement</h3>          <div className="p-5 bg-white rounded-xl border shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">

                  <p className="text-slate-600 leading-relaxed">Auto-generate POs when stock dips below thresholds.</p>            <div className="flex items-start gap-3">

                </div>              <div className="p-2 bg-green-50 rounded-lg">

              </div>                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

            </div>                  <path d="M3 12h18M8 6h8M8 18h8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

                </svg>

            <div className="group p-6 bg-gradient-to-br from-white via-purple-50/30 to-white rounded-2xl border border-purple-200/50 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">              </div>

              <div className="flex items-start gap-4">              <div>

                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300">                <div className="font-semibold text-lg">Automate procurement</div>

                  <HiTruck className="w-6 h-6 text-white" />                <p className="text-sm text-slate-600 mt-1">Auto-generate POs when stock dips below thresholds.</p>

                </div>              </div>

                <div>            </div>

                  <h3 className="font-bold text-lg text-slate-900 mb-2">Ship & track</h3>          </div>

                  <p className="text-slate-600 leading-relaxed">Integrate with carriers, print labels, and update statuses automatically.</p>

                </div>          <div className="p-5 bg-white rounded-xl border shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">

              </div>            <div className="flex items-start gap-3">

            </div>              <div className="p-2 bg-indigo-50 rounded-lg">

          </div>                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

        </section>                  <path d="M3 7l6 6-6 6M21 7l-6 6 6 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

                </svg>

        {/* Features grid */}              </div>

        <section aria-labelledby="features-heading" className="mb-16">              <div>

          <h2 id="features-heading" className="text-3xl sm:text-4xl font-bold mb-12 text-center">                <div className="font-semibold text-lg">Ship & track</div>

            <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">                <p className="text-sm text-slate-600 mt-1">Integrate with carriers, print labels, and update statuses automatically.</p>

              Key              </div>

            </span>            </div>

            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent"> features</span>          </div>

          </h2>        </div>

      </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {[      {/* Features grid */}

              {      <section aria-labelledby="features-heading" className="mt-8">

                title: 'Order & Sales Management',        <h2 id="features-heading" className="text-2xl font-semibold mb-6 text-slate-800">

                desc: 'Create sales orders, convert to invoices, manage returns and backorders.',          Key features

                icon: HiShoppingCart,        </h2>

                gradient: 'from-blue-500 to-blue-600'

              },        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {          {[

                title: 'Purchase & Supplier Workflows',            {

                desc: 'Raise POs, track lead times, and reconcile receipts with orders.',              title: 'Order & Sales Management',

                icon: HiClipboardList,              desc: 'Create sales orders, convert to invoices, manage returns and backorders.',

                gradient: 'from-emerald-500 to-emerald-600'            },

              },            {

              {              title: 'Purchase & Supplier Workflows',

                title: 'Barcode & Mobile Scanning',              desc: 'Raise POs, track lead times, and reconcile receipts with orders.',

                desc: 'Speed up receiving, picking, and stocktakes with a mobile-friendly scanner UI.',            },

                icon: HiCube,            {

                gradient: 'from-purple-500 to-purple-600'              title: 'Barcode & Mobile Scanning',

              },              desc: 'Speed up receiving, picking, and stocktakes with a mobile-friendly scanner UI.',

              {            },

                title: 'Reports & Analytics',            {

                desc: 'Inventory valuation, movement reports, and custom exports.',              title: 'Reports & Analytics',

                icon: HiChartBar,              desc: 'Inventory valuation, movement reports, and custom exports.',

                gradient: 'from-teal-500 to-teal-600'            },

              },            {

              {              title: 'Multi-Channel & Integrations',

                title: 'Multi-Channel & Integrations',              desc: 'Connect online stores, accounting systems, and shipping providers.',

                desc: 'Connect online stores, accounting systems, and shipping providers.',            },

                icon: HiCog,            {

                gradient: 'from-orange-500 to-orange-600'              title: 'Security & Compliance',

              },              desc: 'Audit trails, role-based access, and controlled permissions.',

              {            },

                title: 'Security & Compliance',          ].map((f) => (

                desc: 'Audit trails, role-based access, and controlled permissions.',            <article

                icon: HiShield,              key={f.title}

                gradient: 'from-pink-500 to-pink-600'              className="p-5 bg-white rounded-xl border hover:shadow-lg transition transform hover:-translate-y-0.5"

              },            >

            ].map((feature) => {              <h3 className="text-lg font-medium">{f.title}</h3>

              const IconComponent = feature.icon;              <p className="text-sm text-slate-600 mt-2">{f.desc}</p>

              return (            </article>

                <article          ))}

                  key={feature.title}        </div>

                  className="group p-6 bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"      </section>

                >

                  <div className="flex items-start gap-4">      {/* Integrations & Pricing */}

                    <div className={`p-3 bg-gradient-to-r ${feature.gradient} rounded-xl group-hover:scale-110 transition-transform duration-300`}>      <section className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                      <IconComponent className="w-6 h-6 text-white" />        <div className="lg:col-span-2">

                    </div>          <h2 className="text-2xl font-semibold mb-4 text-slate-800">Connect your stack</h2>

                    <div>          <p className="text-slate-600 mb-4">

                      <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>            Link ecommerce platforms, accounting software, barcode hardware, and shipping services to keep stock

                      <p className="text-slate-600 leading-relaxed">{feature.desc}</p>            and orders synchronized in real time.

                    </div>          </p>

                  </div>

                </article>          <div className="flex flex-wrap gap-3">

              );            {['Shopify', 'QuickBooks', 'WooCommerce', 'Xero', 'FedEx'].map((name) => (

            })}              <div

          </div>                key={name}

        </section>                className="px-4 py-2 bg-slate-50 border rounded-full text-sm text-slate-700 shadow-sm"

              >

        {/* Integrations & Pricing */}                {name}

        <section className="mb-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">              </div>

          <div className="lg:col-span-2">            ))}

            <h2 className="text-3xl font-bold mb-6">          </div>

              <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">

                Connect your          <div className="mt-6">

              </span>            <Link href="/integrations" className="text-blue-600 hover:underline">

              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent"> stack</span>              See available integrations →

            </h2>            </Link>

            <p className="text-lg text-slate-600 mb-6 leading-relaxed">          </div>

              Link ecommerce platforms, accounting software, barcode hardware, and shipping services to keep stock        </div>

              and orders synchronized in real time.

            </p>        <aside className="p-5 bg-gradient-to-br from-white to-slate-50 rounded-xl border shadow-sm">

          <h3 className="text-lg font-semibold">Plans to match your growth</h3>

            <div className="flex flex-wrap gap-3 mb-6">          <p className="text-sm text-slate-600 mt-2">Choose a tier that fits your team and scale when you are ready.</p>

              {['Shopify', 'QuickBooks', 'WooCommerce', 'Xero', 'FedEx'].map((name) => (

                <div          <div className="mt-4 grid grid-cols-1 gap-3">

                  key={name}            <div className="p-3 bg-white rounded-lg border flex items-center justify-between">

                  className="px-4 py-2 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 shadow-sm hover:shadow-md transition-all duration-200"              <div>

                >                <div className="font-medium">Starter</div>

                  {name}                <div className="text-sm text-slate-500">Small teams · Basic inventory</div>

                </div>              </div>

              ))}              <div className="text-sm font-semibold">$29/mo</div>

            </div>            </div>



            <div>            <div className="p-3 bg-white rounded-lg border flex items-center justify-between ring-2 ring-blue-50">

              <Link href="/integrations" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">              <div>

                See available integrations                <div className="font-medium">Growth</div>

                <HiArrowRight className="w-4 h-4" />                <div className="text-sm text-slate-500">Multi-warehouse · Automations</div>

              </Link>              </div>

            </div>              <div className="text-sm font-semibold">$99/mo</div>

          </div>            </div>



          <aside className="p-6 bg-gradient-to-br from-white via-slate-50/50 to-white rounded-2xl border border-slate-200/50 shadow-lg">            <div className="p-3 bg-white rounded-lg border flex items-center justify-between">

            <h3 className="text-xl font-bold text-slate-900 mb-2">Plans to match your growth</h3>              <div>

            <p className="text-slate-600 mb-6">Choose a tier that fits your team and scale when you are ready.</p>                <div className="font-medium">Enterprise</div>

                <div className="text-sm text-slate-500">Custom SLAs · SSO</div>

            <div className="space-y-4">              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow duration-200">              <div className="text-sm font-semibold">Contact</div>

                <div>            </div>

                  <div className="font-semibold text-slate-900">Starter</div>          </div>

                  <div className="text-sm text-slate-500">Small teams · Basic inventory</div>

                </div>          <div className="mt-4">

                <div className="text-lg font-bold text-slate-900">$29/mo</div>            <Link href="/pricing" className="inline-block text-sm text-blue-600 hover:underline">

              </div>              Compare plans →

            </Link>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 flex items-center justify-between ring-2 ring-blue-200/50">          </div>

                <div>        </aside>

                  <div className="font-semibold text-slate-900">Growth</div>      </section>

                  <div className="text-sm text-slate-600">Multi-warehouse · Automations</div>

                </div>      {/* Trust & CTA */}

                <div className="text-lg font-bold text-blue-600">$99/mo</div>      <section className="mt-10 bg-gradient-to-r from-slate-50 to-white rounded-2xl p-6 border">

              </div>        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          <blockquote className="italic text-slate-700 max-w-2xl">

              <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow duration-200">            “Nexus helped us reduce stock discrepancies and cut fulfillment times in half.” — Operations Manager

                <div>          </blockquote>

                  <div className="font-semibold text-slate-900">Enterprise</div>

                  <div className="text-sm text-slate-500">Custom SLAs · SSO</div>          <div className="flex gap-3">

                </div>            <Link

                <div className="text-lg font-bold text-slate-900">Contact</div>              href="/signup"

              </div>              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"

            </div>            >

              Start free trial

            <div className="mt-6">            </Link>

              <Link href="/pricing" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">            <Link

                Compare plans              href="/contact"

                <HiArrowRight className="w-4 h-4" />              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 transition"

              </Link>            >

            </div>              Schedule demo

          </aside>            </Link>

        </section>          </div>

        </div>

        {/* Trust & CTA */}      </section>

        <section className="mb-16 bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 rounded-3xl p-8 border border-slate-200/50">

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">      {/* FAQ */}

            <blockquote className="italic text-lg text-slate-700 max-w-2xl leading-relaxed">      <section aria-labelledby="faq-heading" className="mt-10">

              "Nexus helped us reduce stock discrepancies and cut fulfillment times in half."         <h2 id="faq-heading" className="text-2xl font-semibold mb-4 text-slate-800">

              <span className="block mt-2 text-base font-medium not-italic text-slate-600">— Operations Manager</span>          FAQ

            </blockquote>        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="flex gap-4">          <div className="p-4 bg-white rounded-xl border">

              <Link            <dt className="font-medium">Do I need to install anything?</dt>

                href="/signup"            <dd className="text-slate-600 mt-2">No — Nexus is web-first. Mobile scanning works with the web UI or companion apps.</dd>

                className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"          </div>

              >          <div className="p-4 bg-white rounded-xl border">

                <HiRocketLaunch className="w-5 h-5 group-hover:animate-bounce" />            <dt className="font-medium">Can I migrate data from my current system?</dt>

                Start free trial            <dd className="text-slate-600 mt-2">Yes — CSV import and migration services are available for common platforms and ERPs.</dd>

              </Link>          </div>

              <Link        </div>

                href="/contact"      </section>

                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transform hover:scale-105 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"    </main>

              >  );

                <HiPlay className="w-5 h-5" />}

                Schedule demo
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-3xl sm:text-4xl font-bold mb-12 text-center">
            <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
              Frequently asked
            </span>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent"> questions</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <dt className="font-bold text-lg text-slate-900 mb-3">Do I need to install anything?</dt>
              <dd className="text-slate-600 leading-relaxed">No — Nexus is web-first. Mobile scanning works with the web UI or companion apps.</dd>
            </div>
            <div className="p-6 bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <dt className="font-bold text-lg text-slate-900 mb-3">Can I migrate data from my current system?</dt>
              <dd className="text-slate-600 leading-relaxed">Yes — CSV import and migration services are available for common platforms and ERPs.</dd>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}