"use client";

import { useState } from "react";
import { FiUser, FiMail, FiBriefcase, FiMessageSquare, FiSend, FiPhone, FiMapPin } from "react-icons/fi";

export default function ContactPage() {
   const [formData, setFormData] = useState({
      name: "",
      email: "",
      company: "",
      type: "sales",
      message: "",
   });
   const [status, setStatus] = useState(null);

   const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setStatus({ type: "info", message: "Sending..." });
      try {
         const res = await fetch("/api/lead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
         });
         if (res.ok) {
            setStatus({ type: "success", message: "Message sent! We will get back to you shortly." });
            setFormData({ name: "", email: "", company: "", type: "sales", message: "" });
         } else {
            throw new Error("Failed to send message.");
         }
      } catch (err) {
         setStatus({ type: "error", message: "An error occurred. Please try again later." });
      }
   };

   return (
      <div className="bg-gray-900 text-white">
         {/* Hero Section */}
         <div className="text-center py-20 md:py-28">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Get in Touch</h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
               Whether you have a question about features, trials, pricing, or anything else, our team is ready to
               answer all your questions.
            </p>
         </div>

         <div className="container mx-auto px-4 pb-20 md:pb-28">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               {/* Contact Form */}
               <div className="lg:col-span-2 bg-gray-800/50 border border-gray-700 rounded-2xl p-8 shadow-2xl">
                  <h2 className="text-3xl font-bold mb-6">Send us a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                           <label htmlFor="name" className="sr-only">
                              Name
                           </label>
                           <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                           <input
                              type="text"
                              name="name"
                              id="name"
                              value={formData.name}
                              onChange={handleChange}
                              placeholder="Your Name"
                              required
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                        </div>
                        <div className="relative">
                           <label htmlFor="email" className="sr-only">
                              Email
                           </label>
                           <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                           <input
                              type="email"
                              name="email"
                              id="email"
                              value={formData.email}
                              onChange={handleChange}
                              placeholder="Your Email"
                              required
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                           />
                        </div>
                     </div>
                     <div className="relative">
                        <label htmlFor="company" className="sr-only">
                           Company
                        </label>
                        <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                           type="text"
                           name="company"
                           id="company"
                           value={formData.company}
                           onChange={handleChange}
                           placeholder="Your Company (Optional)"
                           className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                     </div>
                     <div className="relative">
                        <label htmlFor="type" className="sr-only">
                           Inquiry Type
                        </label>
                        <select
                           name="type"
                           id="type"
                           value={formData.type}
                           onChange={handleChange}
                           className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                        >
                           <option value="sales">Sales Inquiry</option>
                           <option value="support">Customer Support</option>
                           <option value="press">Press & Media</option>
                           <option value="partnership">Partnership</option>
                           <option value="other">Other</option>
                        </select>
                     </div>
                     <div className="relative">
                        <label htmlFor="message" className="sr-only">
                           Message
                        </label>
                        <FiMessageSquare className="absolute left-4 top-5 text-gray-400" />
                        <textarea
                           name="message"
                           id="message"
                           value={formData.message}
                           onChange={handleChange}
                           rows="5"
                           placeholder="Your Message"
                           required
                           className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        ></textarea>
                     </div>
                     <div>
                        <button
                           type="submit"
                           className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-50"
                        >
                           <FiSend />
                           <span>Send Message</span>
                        </button>
                     </div>
                     {status && (
                        <div
                           role="alert"
                           className={`text-sm p-3 rounded-lg ${status.type === "success" ? "bg-green-900/50 text-green-300" : status.type === "error" ? "bg-red-900/50 text-red-300" : "bg-blue-900/50 text-blue-300"}`}
                        >
                           {status.message}
                        </div>
                     )}
                  </form>
               </div>

               {/* Direct Contact Info */}
               <div className="space-y-8">
                  <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 flex items-start gap-4">
                     <div className="bg-indigo-600/20 text-indigo-400 p-3 rounded-full">
                        <FiMail className="h-6 w-6" />
                     </div>
                     <div>
                        <h3 className="text-xl font-semibold">Email Us</h3>
                        <p className="text-gray-400">General inquiries and support.</p>
                        <a href="mailto:support@nexus.com" className="text-indigo-400 hover:underline">
                           support@nexus.com
                        </a>
                     </div>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 flex items-start gap-4">
                     <div className="bg-indigo-600/20 text-indigo-400 p-3 rounded-full">
                        <FiPhone className="h-6 w-6" />
                     </div>
                     <div>
                        <h3 className="text-xl font-semibold">Call Us</h3>
                        <p className="text-gray-400">Mon-Fri from 8am to 5pm.</p>
                        <a href="tel:+1-555-555-5555" className="text-indigo-400 hover:underline">
                           +1 (555) 555-5555
                        </a>
                     </div>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 flex items-start gap-4">
                     <div className="bg-indigo-600/20 text-indigo-400 p-3 rounded-full">
                        <FiMapPin className="h-6 w-6" />
                     </div>
                     <div>
                        <h3 className="text-xl font-semibold">Our Office</h3>
                        <p className="text-gray-400">
                           123 Innovation Drive
                           <br />
                           Tech City, TX 75001
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
