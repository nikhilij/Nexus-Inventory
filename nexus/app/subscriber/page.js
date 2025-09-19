"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SubscriberGatePage() {
   const [loading, setLoading] = useState(true);
   const [user, setUser] = useState(null);
   const [error, setError] = useState(null);
   const [pin, setPin] = useState("");
   const [validating, setValidating] = useState(false);
   const [authorized, setAuthorized] = useState(false);
   const [message, setMessage] = useState(null);

   useEffect(() => {
      let mounted = true;
      async function fetchUser() {
         try {
            const res = await fetch("/api/user");
            const json = await res.json();
            if (!mounted) return;
            setUser(json);
         } catch (e) {
            if (!mounted) return;
            setError("Unable to reach authentication service.");
         } finally {
            if (mounted) setLoading(false);
         }
      }
      fetchUser();
      return () => {
         mounted = false;
      };
   }, []);

   async function handleSubmitPin(e) {
      e.preventDefault();
      setMessage(null);
      if (!/^[0-9]{6}$/.test(pin)) {
         setMessage("Please enter a valid 6-digit PIN.");
         return;
      }
      setValidating(true);
      try {
         const res = await fetch("/api/validate-pin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin }),
         });
         const json = await res.json();
         if (res.ok && json?.ok) {
            setAuthorized(true);
         } else {
            setMessage(json?.error || "Invalid PIN.");
         }
      } catch (e) {
         setMessage("Network error while validating PIN.");
      } finally {
         setValidating(false);
      }
   }

   if (loading)
      return (
         <main id="content" className="p-6 text-center">
            Loading…
         </main>
      );
   if (error)
      return (
         <main id="content" className="p-6 text-center">
            <p role="alert" className="text-red-600">
               {error}
            </p>
         </main>
      );

   // If user is not authenticated, prompt to sign in
   if (!user?.authenticated) {
      return (
         <main id="content" className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
               <h1 className="text-2xl font-bold mb-4">Access requires sign in</h1>
               <p className="mb-6">You must be signed in to access subscriber-only areas.</p>
               <div className="flex gap-4">
                  <Link
                     href="/login"
                     className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
                  >
                     Sign in
                  </Link>
                  <Link
                     href="/signup"
                     className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer"
                  >
                     Sign up
                  </Link>
               </div>
            </div>
         </main>
      );
   }

   // User is signed in but not subscribed
   if (!user?.subscribed) {
      return (
         <main id="content" className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-md">
               <h1 className="text-2xl font-bold mb-4">You are not subscribed yet</h1>
               <p role="status" className="mb-6">
                  Hi {user?.user?.name ?? "there"}, it looks like you do not have an active subscription for our product
                  inventory service.
               </p>

               <section aria-labelledby="contact-cta" className="mb-6">
                  <h2 id="contact-cta" className="text-xl font-semibold mb-2">
                     Need help getting started?
                  </h2>
                  <p className="mb-4">
                     Share about your business, tell us what you are planning, and let the team know if you need
                     assistance setting up inventory tracking, integrations, or workflows.
                  </p>
                  <div className="flex gap-4 mb-4">
                     <Link
                        href="/contact"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
                     >
                        Contact our team
                     </Link>
                     <Link
                        href="/signup"
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer"
                     >
                        Start a subscription
                     </Link>
                  </div>
                  <p>
                     Prefer to talk? Email{" "}
                     <a href="mailto:sales@example.com" className="text-blue-600 underline">
                        sales@example.com
                     </a>{" "}
                     or call +1 (555) 555-5555.
                  </p>
               </section>
            </div>
         </main>
      );
   }

   // Subscribed user: require 6-digit PIN to proceed
   if (!authorized) {
      return (
         <main id="content" className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
               <h1 className="text-2xl font-bold mb-4">Enter your 6‑digit access PIN</h1>
               <p role="status" className="mb-6">
                  As an extra security step, please enter the 6-digit PIN provided by your organization to access the
                  product inventory.
               </p>

               <form onSubmit={handleSubmitPin} aria-describedby="pin-help" className="mb-6">
                  <label htmlFor="access-pin" className="block text-sm font-medium mb-2">
                     6-digit PIN
                  </label>
                  <div className="flex gap-4">
                     <input
                        id="access-pin"
                        name="pin"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoComplete="one-time-code"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-required="true"
                     />
                     <button
                        type="submit"
                        disabled={validating}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                     >
                        {validating ? "Validating…" : "Unlock"}
                     </button>
                  </div>
                  <div id="pin-help" className="mt-2">
                     <small className="text-red-600">{message}</small>
                  </div>
               </form>

               <div>
                  <p>
                     If you do not have a PIN, contact your organization administrator or{" "}
                     <Link href="/contact" className="text-blue-600 underline">
                        contact our support team
                     </Link>
                     .
                  </p>
               </div>
            </div>
         </main>
      );
   }

   // Authorized — render protected product inventory entry point (simple placeholder)
   return (
      <main id="content" className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
            <h1 className="text-2xl font-bold mb-4">Welcome to the Inventory</h1>
            <p role="status" className="mb-6">
               Access granted. You may now enter the product inventory.
            </p>
            <div>
               <Link
                  href="/inventory"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
               >
                  Enter Inventory
               </Link>
            </div>
         </div>
      </main>
   );
}
