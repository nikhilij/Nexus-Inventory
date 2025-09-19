import { FiArrowRight, FiAward, FiBarChart2, FiBriefcase, FiCpu, FiHeart, FiUsers } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
   title: "About Us — Nexus Inventory",
   description:
      "Learn about Nexus Inventory — our mission, team, and how we help businesses automate inventory and reduce stockouts.",
};

const stats = [
   { id: 1, name: "Businesses Served", value: "500+", icon: FiBriefcase },
   { id: 2, name: "Stockouts Reduced on Avg", value: "32%", icon: FiBarChart2 },
   { id: 3, name: "Uptime Guarantee", value: "99.99%", icon: FiAward },
   { id: 4, name: "Customer Satisfaction", value: "98%", icon: FiHeart },
];

const timeline = [
   {
      year: "2021",
      title: "The Idea",
      description:
         "Nexus was born from the frustration of manual inventory tracking and the vision for a smarter, automated solution.",
   },
   {
      year: "2022",
      title: "Launch Day",
      description:
         "After months of development, Nexus Inventory launched its first version, helping small businesses gain control.",
   },
   {
      year: "2023",
      title: "AI Integration",
      description:
         "We introduced AI-powered forecasting, providing predictive insights to prevent stockouts before they happen.",
   },
   {
      year: "2024",
      title: "Enterprise Ready",
      description:
         "Nexus expanded its feature set with multi-warehouse support and advanced security for larger organizations.",
   },
   {
      year: "2025",
      title: "Going Global",
      description: "Serving over 500 businesses worldwide and continuing to innovate on our platform.",
   },
];

const team = [
   { name: "Alex Johnson", role: "Founder & CEO", image: "/team/alex.jpg" },
   { name: "Maria Garcia", role: "Chief Technology Officer", image: "/team/maria.jpg" },
   { name: "David Chen", role: "Head of Product", image: "/team/david.jpg" },
   { name: "Sarah Lee", role: "Lead, Customer Success", image: "/team/sarah.jpg" },
];

export default function AboutPage() {
   return (
      <div className="bg-gray-900 text-white">
         {/* Hero Section */}
         <section className="relative bg-gray-900 text-center py-20 md:py-32">
            <div className="absolute inset-0 bg-indigo-900/30 opacity-50"></div>
            <div className="relative container mx-auto px-4">
               <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  Smarter Inventory, Smoother Operations.
               </h1>
               <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-gray-300">
                  We are on a mission to eliminate stockouts, reduce waste, and reclaim time for operations teams
                  everywhere through intelligent automation.
               </p>
               <div className="mt-10 flex justify-center gap-4">
                  <Link
                     href="/signup"
                     className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-500 transition-transform hover:scale-105 shadow-lg"
                  >
                     Start Free Trial <FiArrowRight />
                  </Link>
                  <Link
                     href="/contact"
                     className="inline-flex items-center gap-2 bg-gray-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-700 transition-transform hover:scale-105 shadow-lg"
                  >
                     Request a Demo
                  </Link>
               </div>
            </div>
         </section>

         {/* Stats Section */}
         <section className="py-16 sm:py-24 bg-gray-900">
            <div className="container mx-auto px-4">
               <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                  {stats.map((stat) => (
                     <div
                        key={stat.id}
                        className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 flex items-start gap-4 transform hover:-translate-y-2 transition-transform duration-300"
                     >
                        <div className="bg-indigo-600/20 text-indigo-400 p-3 rounded-full">
                           <stat.icon className="h-7 w-7" aria-hidden="true" />
                        </div>
                        <div>
                           <p className="text-4xl font-bold tracking-tight">{stat.value}</p>
                           <p className="text-base text-gray-400">{stat.name}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* Timeline Section */}
         <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
               <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Our Journey</h2>
                  <p className="mt-4 text-lg text-gray-400">From a simple idea to a global platform.</p>
               </div>
               <div className="relative">
                  <div className="absolute left-1/2 w-0.5 h-full bg-gray-700 -translate-x-1/2 hidden md:block"></div>
                  {timeline.map((item, index) => (
                     <div
                        key={item.year}
                        className={`md:flex items-center w-full mb-8 ${index % 2 === 0 ? "md:flex-row-reverse" : ""}`}
                     >
                        <div className="md:w-1/2"></div>
                        <div className="md:w-1/2 md:pl-8 md:pr-8">
                           <div
                              className={`bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg relative ${index % 2 === 0 ? "md:ml-8" : "md:mr-8"}`}
                           >
                              <div className="absolute -top-4 -left-4 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white ring-8 ring-gray-900">
                                 {item.year.slice(-2)}
                              </div>
                              <h3 className="text-xl font-bold text-indigo-400">{item.title}</h3>
                              <p className="mt-2 text-gray-300">{item.description}</p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* Team Section */}
         <section className="py-16 sm:py-24 bg-gray-800/30">
            <div className="container mx-auto px-4">
               <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Meet the Innovators</h2>
                  <p className="mt-4 text-lg text-gray-400">The passionate minds behind Nexus Inventory.</p>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {team.map((member) => (
                     <div key={member.name} className="text-center">
                        <div className="relative w-40 h-40 mx-auto mb-4">
                           <Image
                              src={member.image}
                              alt={member.name}
                              layout="fill"
                              className="rounded-full object-cover"
                           />
                        </div>
                        <h3 className="text-xl font-semibold">{member.name}</h3>
                        <p className="text-indigo-400">{member.role}</p>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* Careers Section */}
         <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4 text-center">
               <FiBriefcase className="mx-auto h-12 w-12 text-gray-500" />
               <h2 className="mt-6 text-3xl font-bold tracking-tight">Join Our Team</h2>
               <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                  We’re remote-first, customer-obsessed, and invest in professional growth. Help us build the future of
                  inventory management.
               </p>
               <div className="mt-8">
                  <Link
                     href="/careers"
                     className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-700 transition-colors"
                  >
                     See Open Roles <FiArrowRight />
                  </Link>
               </div>
            </div>
         </section>
      </div>
   );
}
