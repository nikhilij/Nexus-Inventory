import {
   FiArrowRight,
   FiCheckCircle,
   FiClipboard,
   FiDatabase,
   FiUsers,
   FiSettings,
   FiLifeBuoy,
   FiPhoneCall,
} from "react-icons/fi";
import Link from "next/link";

export const metadata = {
   title: "Services — Nexus Inventory",
   description:
      "Implementation, migration, training, and managed services to make your inventory transformation effortless.",
};

const services = [
   {
      name: "Onboarding & Implementation",
      description: "Get up and running in record time with our guided setup and configuration process.",
      icon: FiClipboard,
   },
   {
      name: "Data Migration & Import",
      description: "Seamlessly transfer your existing inventory, supplier, and sales data into Nexus.",
      icon: FiDatabase,
   },
   {
      name: "Custom Integrations",
      description: "Connect Nexus to your unique software stack with tailor-made integrations.",
      icon: FiSettings,
   },
   {
      name: "On-site Consulting & Audit",
      description: "Our experts analyze your physical operations to identify efficiency gains.",
      icon: FiUsers,
   },
];

const supportTiers = [
   {
      name: "Standard",
      price: "Included",
      features: ["Email Support", "24-hour Response Time", "Knowledge Base Access"],
      cta: "Included with all plans",
   },
   {
      name: "Priority",
      price: "$199/mo",
      features: ["Priority Email & Chat", "8-hour Response Time", "Dedicated Onboarding Specialist"],
      cta: "Add to Plan",
   },
   {
      name: "Enterprise",
      price: "Custom",
      features: [
         "24/7 Phone & Chat",
         "1-hour Critical Response",
         "Dedicated Account Manager",
         "Quarterly Business Reviews",
      ],
      cta: "Contact Sales",
   },
];

export default function ServicesPage() {
   return (
      <div className="bg-gray-900 text-white">
         {/* Hero Section */}
         <section className="text-center py-20 md:py-32">
            <div className="container mx-auto px-4">
               <FiLifeBuoy className="mx-auto h-16 w-16 text-indigo-400 mb-6" />
               <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Services to Ensure Your Success</h1>
               <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-gray-300">
                  From rapid onboarding to custom integrations and on-site audits, our team is dedicated to delivering
                  measurable operational improvements for your business.
               </p>
            </div>
         </section>

         {/* Services Offerings Section */}
         <section className="py-16 sm:py-24 bg-gray-900/50">
            <div className="container mx-auto px-4">
               <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Our Professional Services</h2>
                  <p className="mt-4 text-lg text-gray-400">
                     A partnership approach to transforming your inventory management.
                  </p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {services.map((service) => (
                     <div
                        key={service.name}
                        className="bg-gray-800 border border-gray-700 rounded-2xl p-8 flex flex-col items-center text-center transform hover:-translate-y-2 transition-transform duration-300"
                     >
                        <div className="bg-indigo-600/20 text-indigo-400 p-4 rounded-full mb-4">
                           <service.icon className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-semibold flex-grow">{service.name}</h3>
                        <p className="mt-2 text-gray-400">{service.description}</p>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* Implementation Approach Section */}
         <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
               <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Our Proven Implementation Process</h2>
                  <p className="mt-4 text-lg text-gray-400">A four-step journey to operational excellence.</p>
               </div>
               <div className="relative flex flex-col md:flex-row justify-between items-center">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-700 hidden md:block"></div>
                  <div className="flex-1 text-center relative z-10 mb-8 md:mb-0">
                     <div className="inline-block bg-indigo-600 p-4 rounded-full ring-8 ring-gray-900 mb-2">1</div>
                     <h3 className="font-bold">Discovery</h3>
                     <p className="text-sm text-gray-400">Understand goals</p>
                  </div>
                  <div className="flex-1 text-center relative z-10 mb-8 md:mb-0">
                     <div className="inline-block bg-indigo-600 p-4 rounded-full ring-8 ring-gray-900 mb-2">2</div>
                     <h3 className="font-bold">Pilot</h3>
                     <p className="text-sm text-gray-400">Validate solution</p>
                  </div>
                  <div className="flex-1 text-center relative z-10 mb-8 md:mb-0">
                     <div className="inline-block bg-indigo-600 p-4 rounded-full ring-8 ring-gray-900 mb-2">3</div>
                     <h3 className="font-bold">Rollout</h3>
                     <p className="text-sm text-gray-400">Deploy company-wide</p>
                  </div>
                  <div className="flex-1 text-center relative z-10">
                     <div className="inline-block bg-indigo-600 p-4 rounded-full ring-8 ring-gray-900 mb-2">4</div>
                     <h3 className="font-bold">Optimize</h3>
                     <p className="text-sm text-gray-400">Continuous improvement</p>
                  </div>
               </div>
            </div>
         </section>

         {/* Support & SLAs Section */}
         <section className="py-16 sm:py-24 bg-gray-900/50">
            <div className="container mx-auto px-4">
               <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Support & SLAs</h2>
                  <p className="mt-4 text-lg text-gray-400">
                     Choose the level of support that fits your business needs.
                  </p>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                  {supportTiers.map((tier) => (
                     <div key={tier.name} className="bg-gray-800 border border-gray-700 rounded-2xl p-8 flex flex-col">
                        <h3 className="text-2xl font-bold text-indigo-400">{tier.name}</h3>
                        <p className="my-4 text-4xl font-bold">{tier.price}</p>
                        <ul className="space-y-3 mb-8 flex-grow">
                           {tier.features.map((feature) => (
                              <li key={feature} className="flex items-center gap-3">
                                 <FiCheckCircle className="h-5 w-5 text-green-400" />
                                 <span className="text-gray-300">{feature}</span>
                              </li>
                           ))}
                        </ul>
                        <Link
                           href="/contact"
                           className={`w-full text-center mt-auto px-6 py-3 rounded-full font-semibold transition-colors ${tier.name === "Enterprise" ? "bg-indigo-600 hover:bg-indigo-500" : "bg-gray-700 hover:bg-gray-600"}`}
                        >
                           {tier.cta}
                        </Link>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* CTA Section */}
         <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4 text-center">
               <FiPhoneCall className="mx-auto h-12 w-12 text-gray-500" />
               <h2 className="mt-6 text-3xl font-bold tracking-tight">Ready to Transform Your Operations?</h2>
               <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                  Let&apos;s talk about how Nexus can help. Schedule a free, no-obligation discovery call with one of
                  our inventory experts today.
               </p>
               <div className="mt-8">
                  <Link
                     href="/contact"
                     className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-500 transition-transform hover:scale-105 shadow-lg"
                  >
                     Book Discovery Call <FiArrowRight />
                  </Link>
               </div>
            </div>
         </section>
      </div>
   );
}
