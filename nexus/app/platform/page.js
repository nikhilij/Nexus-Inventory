import {
   FiActivity,
   FiDatabase,
   FiShield,
   FiCode,
   FiLayers,
   FiCpu,
   FiGitMerge,
   FiCheckCircle,
   FiArrowRight,
} from "react-icons/fi";
import Link from "next/link";

export const metadata = {
   title: "Platform — Nexus Inventory",
   description:
      "Technical overview of the Nexus Inventory platform: architecture, integrations, APIs, security, and deployment options for enterprise-grade inventory control.",
};

const capabilities = [
   {
      name: "Real-time Inventory Sync",
      description: "Instantly track stock levels across all channels and locations.",
      icon: FiActivity,
   },
   {
      name: "AI-Powered Forecasting",
      description: "Predict demand and prevent stockouts with 95% accuracy.",
      icon: FiCpu,
   },
   {
      name: "Automated Purchase Orders",
      description: "Generate and send POs automatically based on reorder points.",
      icon: FiGitMerge,
   },
   {
      name: "Batch & Expiry Tracking",
      description: "Manage perishable goods and ensure compliance with lot tracking.",
      icon: FiDatabase,
   },
];

const securityFeatures = [
   "End-to-End Encryption (AES-256)",
   "SOC 2 Type II Certified",
   "GDPR & CCPA Compliant",
   "Single Sign-On (SSO/SAML)",
   "Role-Based Access Control (RBAC)",
   "Comprehensive Audit Trails",
];

export default function PlatformPage() {
   return (
      <div className="bg-gray-900 text-white">
         {/* Hero Section */}
         <section className="text-center py-20 md:py-32">
            <div className="container mx-auto px-4">
               <FiLayers className="mx-auto h-16 w-16 text-indigo-400 mb-6" />
               <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                  A Platform Built for Scale & Security
               </h1>
               <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-gray-300">
                  Our API-first, cloud-native architecture is designed for reliability and seamless integration with
                  your existing commerce, accounting, and warehouse systems.
               </p>
            </div>
         </section>

         {/* Capabilities Section */}
         <section className="py-16 sm:py-24 bg-gray-900/50">
            <div className="container mx-auto px-4">
               <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Core Capabilities</h2>
                  <p className="mt-4 text-lg text-gray-400">The engine that drives your inventory operations.</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {capabilities.map((item) => (
                     <div
                        key={item.name}
                        className="bg-gray-800 border border-gray-700 rounded-2xl p-8 text-center transform hover:-translate-y-2 transition-transform duration-300 shadow-lg"
                     >
                        <div className="inline-block bg-indigo-600/20 text-indigo-400 p-4 rounded-full mb-4">
                           <item.icon className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-semibold">{item.name}</h3>
                        <p className="mt-2 text-gray-400">{item.description}</p>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* Architecture Section */}
         <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
               <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Cloud-Native Architecture</h2>
                  <p className="mt-4 text-lg text-gray-400">
                     Designed for high availability, performance, and infinite scalability.
                  </p>
               </div>
               <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
                  {/* Simplified architecture diagram */}
                  <div className="flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-8 text-center">
                     <div className="flex-1">
                        <h4 className="font-bold text-indigo-400">Frontend</h4>
                        <p className="text-sm text-gray-300">Next.js Web App</p>
                     </div>
                     <FiArrowRight className="text-gray-500 rotate-90 md:rotate-0" />
                     <div className="flex-1">
                        <h4 className="font-bold text-indigo-400">API Layer</h4>
                        <p className="text-sm text-gray-300">GraphQL & REST</p>
                     </div>
                     <FiArrowRight className="text-gray-500 rotate-90 md:rotate-0" />
                     <div className="flex-1">
                        <h4 className="font-bold text-indigo-400">Backend Services</h4>
                        <p className="text-sm text-gray-300">Microservices & Workers</p>
                     </div>
                     <FiArrowRight className="text-gray-500 rotate-90 md:rotate-0" />
                     <div className="flex-1">
                        <h4 className="font-bold text-indigo-400">Data Layer</h4>
                        <p className="text-sm text-gray-300">PostgreSQL & Redis</p>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* Developer & Security Section */}
         <section className="py-16 sm:py-24 bg-gray-900/50">
            <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
               {/* Developer Resources */}
               <div>
                  <div className="flex items-center gap-4 mb-6">
                     <FiCode className="h-10 w-10 text-indigo-400" />
                     <h2 className="text-3xl font-bold tracking-tight">For Developers</h2>
                  </div>
                  <p className="text-gray-300 mb-6">
                     Integrate Nexus with any tool in your stack. Our comprehensive API and developer resources make it
                     easy to build custom workflows.
                  </p>
                  <Link
                     href="/developers"
                     className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-indigo-500 transition-colors"
                  >
                     Explore API Docs <FiArrowRight />
                  </Link>
               </div>

               {/* Security */}
               <div>
                  <div className="flex items-center gap-4 mb-6">
                     <FiShield className="h-10 w-10 text-indigo-400" />
                     <h2 className="text-3xl font-bold tracking-tight">Enterprise-Grade Security</h2>
                  </div>
                  <p className="text-gray-300 mb-6">
                     Your data is protected with industry-leading security and compliance standards.
                  </p>
                  <ul className="space-y-3">
                     {securityFeatures.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                           <FiCheckCircle className="h-5 w-5 text-green-400" />
                           <span className="text-gray-300">{feature}</span>
                        </li>
                     ))}
                  </ul>
               </div>
            </div>
         </section>
      </div>
   );
}
