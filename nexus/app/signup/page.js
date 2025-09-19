"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiUser, FiMail, FiLock, FiBriefcase, FiPhone, FiUserPlus, FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

export default function SignupPage() {
   const [name, setName] = useState("");
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [company, setCompany] = useState("");
   const [phone, setPhone] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [error, setError] = useState(null);
   const [isLoading, setIsLoading] = useState(false);
   const router = useRouter();

   async function handleGoogleSignIn() {
      setIsLoading(true);
      setError(null);
      try {
         const result = await signIn("google", { redirect: false, callbackUrl: "/" });
         if (result?.error) {
            setError(result.error === "Callback" ? "Sign up failed. Please try again." : result.error);
         } else if (result?.ok) {
            router.push(result.url || "/");
         }
      } catch (err) {
         setError("An unexpected error occurred during sign-up.");
      } finally {
         setIsLoading(false);
      }
   }

   async function handleEmailSignup(e) {
      e.preventDefault();
      setIsLoading(true);
      setError(null);

      try {
         const res = await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, company, phone }),
         });

         if (res.ok) {
            // Optionally sign them in directly after signup
            const signInRes = await signIn("credentials", {
               redirect: false,
               email,
               password,
            });
            if (signInRes.ok) {
               router.push("/");
            } else {
               setError("Account created, but auto sign-in failed. Please log in manually.");
            }
         } else {
            const data = await res.json();
            setError(data.error || "Signup failed. Please try again.");
         }
      } catch (err) {
         setError("A network error occurred. Please try again.");
      } finally {
         setIsLoading(false);
      }
   }

   return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
         <div className="w-full max-w-md">
            <div className="text-center mb-8">
               <div className="inline-block bg-indigo-600 p-3 rounded-full mb-4">
                  <FiUserPlus size={32} />
               </div>
               <h1 className="text-4xl font-bold tracking-tight">Create Your Account</h1>
               <p className="text-gray-400 mt-2">Join Nexus to manage your inventory seamlessly.</p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
               <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  <FcGoogle size={24} />
                  <span className="text-sm font-medium">{isLoading ? "Processing..." : "Sign up with Google"}</span>
               </button>

               <div className="flex items-center my-6">
                  <hr className="w-full border-gray-600" />
                  <span className="px-4 text-xs font-medium text-gray-400">OR</span>
                  <hr className="w-full border-gray-600" />
               </div>

               <form onSubmit={handleEmailSignup} className="space-y-5">
                  <div className="relative">
                     <label htmlFor="name" className="sr-only">
                        Full Name
                     </label>
                     <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                     <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Name"
                        required
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                     />
                  </div>

                  <div className="relative">
                     <label htmlFor="email" className="sr-only">
                        Email
                     </label>
                     <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                     <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        required
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                     />
                  </div>

                  <div className="relative">
                     <label htmlFor="password" className="sr-only">
                        Password
                     </label>
                     <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                     <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                        minLength={6}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                     />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                     >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                     </button>
                  </div>

                  <div className="relative">
                     <label htmlFor="company" className="sr-only">
                        Company (Optional)
                     </label>
                     <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                     <input
                        id="company"
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Company (Optional)"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                     />
                  </div>

                  {error && (
                     <div
                        role="alert"
                        className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm"
                     >
                        {error}
                     </div>
                  )}

                  <div>
                     <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        <FiUserPlus />
                        <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
                     </button>
                  </div>
               </form>
            </div>

            <p className="text-center text-sm text-gray-400 mt-8">
               Already have an account?{" "}
               <Link href="/login" className="font-medium text-indigo-400 hover:underline">
                  Sign In
               </Link>
            </p>
         </div>
      </div>
   );
}
