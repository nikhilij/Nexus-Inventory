import Link from "next/link";
import {
   FiArrowRight,
   FiBarChart2,
   FiCheckCircle,
   FiCpu,
   FiGitMerge,
   FiHardDrive,
   FiLayers,
   FiLifeBuoy,
   FiSearch,
   FiShield,
   FiZap,
} from "react-icons/fi";

const features = [
   {
      name: "Real-Time Sync",
      description: "Keep your stock levels perfectly in sync across all sales channels and warehouses.",
      icon: FiZap,
   },
   {
      name: "AI Forecasting",
      description: "Predict future demand with our AI engine to prevent stockouts and overstocking.",
      icon: FiCpu,
   },
   {
      name: "Automated POs",
      description: "Set reorder points and let Nexus automatically generate and send purchase orders.",
      icon: FiGitMerge,
   },
   {
      name: "Warehouse Management",
      description: "Optimize your physical storage with bin locations, cycle counts, and guided picking.",
      icon: FiHardDrive,
   },
   {
      name: "Advanced Reporting",
      description: "Gain deep insights into your inventory performance with customizable reports.",
      icon: FiBarChart2,
   },
   {
      name: "Enterprise Security",
      description: "Protect your data with SSO, role-based access, and comprehensive audit logs.",
      icon: FiShield,
   },
];

const testimonials = [
   {
      quote: "Nexus Inventory transformed our operations. We reduced stockouts by 40% in the first quarter. The AI forecasting is a game-changer.",
      author: "Sarah Johnson",
      role: "COO, EcoLiving Goods",
      avatar: "/avatars/sarah.jpg",
   },
   {
      quote: "The automation features saved our team countless hours. We can now focus on growth instead of manual data entry. Truly indispensable.",
      author: "David Chen",
      role: "Founder, TechGadget Store",
      avatar: "/avatars/david.jpg",
   },
];

export default function Home() {
   return (
      <div className="bg-gray-900 text-white">
         {/* Hero Section */}
         <main className="container mx-auto px-4 pt-24 pb-20 text-center">
            <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
               <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-400 opacity-20 blur-[100px]"></div>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
               The Future of Inventory is Here.
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-300">
               Nexus provides a powerful, intuitive, and automated inventory management platform for businesses that
               refuse to settle for manual errors and stockouts.
            </p>
            <div className="mt-10 flex justify-center gap-4">
               <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-500 transition-transform hover:scale-105 shadow-lg"
               >
                  Get Started Free <FiArrowRight />
               </Link>
               <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-gray-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-700 transition-transform hover:scale-105 shadow-lg"
               >
                  Book a Demo
               </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">No credit card required. 14-day free trial.</p>
         </main>

         {/* Features Section */}
         <section className="py-20 sm:py-28">
            <div className="container mx-auto px-4">
               <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold tracking-tight">Everything You Need, Nothing You Don&apos;t</h2>
                  <p className="mt-4 text-lg text-gray-400">Powerful features designed for efficiency and growth.</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {features.map((feature) => (
                     <div
                        key={feature.name}
                        className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 transform hover:-translate-y-2 transition-transform duration-300"
                     >
                        <div className="bg-indigo-600/20 text-indigo-400 p-3 rounded-full w-min mb-4">
                           <feature.icon className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-semibold">{feature.name}</h3>
                        <p className="mt-2 text-gray-400">{feature.description}</p>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* Social Proof/Testimonials */}
         <section className="py-20 sm:py-28 bg-gray-900/50">
            <div className="container mx-auto px-4">
               <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold tracking-tight">Trusted by High-Growth Companies</h2>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {testimonials.map((testimonial) => (
                     <figure key={testimonial.author} className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
                        <blockquote className="text-lg text-gray-300">
                           <p>&quot;{testimonial.quote}&quot;</p>
                        </blockquote>
                        <figcaption className="mt-6 flex items-center gap-4">
                           {/* Placeholder for avatar */}
                           <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                           <div>
                              <div className="font-semibold">{testimonial.author}</div>
                              <div className="text-gray-400">{testimonial.role}</div>
                           </div>
                        </figcaption>
                     </figure>
                  ))}
               </div>
            </div>
         </section>

         {/* Final CTA */}
         <section className="py-20 sm:py-28">
            <div className="container mx-auto px-4 text-center">
               <h2 className="text-4xl font-bold tracking-tight">Ready to Eliminate Stockouts?</h2>
               <p className="mt-4 max-w-xl mx-auto text-lg text-gray-400">
                  Take control of your inventory today. Start your free trial and see the Nexus difference in minutes.
               </p>
               <div className="mt-8">
                  <Link
                     href="/signup"
                     className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-500 transition-transform hover:scale-105 shadow-lg text-lg"
                  >
                     Start Your 14-Day Free Trial
                  </Link>
               </div>
            </div>
         </section>
      </div>
   );
}
