"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function EyeIcon({ hidden = false }: { hidden?: boolean }) {
  if (hidden) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 3l18 18M10.584 10.587A3 3 0 0012 15a3 3 0 002.414-4.413M9.88 4.603A9.758 9.758 0 0112 4.5c5.523 0 9.75 4.5 9.75 7.5-.28.61-.86 1.55-1.78 2.54m-3.17 2.37C15.312 18.52 13.733 19.5 12 19.5c-5.523 0-9.75-4.5-9.75-7.5 0-.61.248-1.31.694-2.08M7.5 7.5c1.22-1.22 2.79-2.04 4.5-2.25"
        />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M2.25 12s3.75-7.5 9.75-7.5 9.75 7.5 9.75 7.5-3.75 7.5-9.75 7.5S2.25 12 2.25 12z"
      />
      <circle cx="12" cy="12" r="3" strokeWidth="2" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="min-h-screen w-full bg-[#4A3B8D] flex items-center justify-center p-6">
      <div className="w-full max-w-[600px] bg-[#F5F5F5] rounded-[28px] shadow-xl px-8 py-10 relative">
        {/* Back Arrow - Top Left */}
        <Link
          href="/"
          className="absolute top-6 left-6 text-[#D96B7B] hover:text-[#E89A94] transition-colors"
          aria-label="Go back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="h-7 w-7"
          >
            <path
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>

        {/* Logo - Top Right */}
        <div className="absolute top-6 right-6">
          <Image
            src="/images/login/login-logo.png"
            alt="Kis points logo"
            width={120}
            height={120}
            priority
            className="h-auto w-auto max-w-[120px]"
          />
        </div>

        {/* Login Title - Below Back Arrow */}
        <h1 className="text-4xl font-extrabold text-[#4A3B8D] mb-8 mt-4">
          Login
        </h1>

        <form className="grid gap-6" onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            console.error("Login error:", error);
            setError(error.message ?? "Failed to sign in. Please try again.");
            return;
          }
          setError("");
          router.push("/dashboard");
        }}>
          {/* Email Field */}
          <div className="grid gap-2">
            <label htmlFor="email" className="text-base font-semibold text-black">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-12 rounded-[12px] border border-black/20 bg-white px-4 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-[#4A3B8D]/30"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password Field */}
          <div className="grid gap-2">
            <label htmlFor="password" className="text-base font-semibold text-black">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="h-12 w-full rounded-[12px] border border-black/20 bg-white px-4 pr-12 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-[#4A3B8D]/30"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black/80"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
          </div>

          {/* Forgot Password Link - Left Aligned */}
          <div className="text-left">
            <Link href="#" className="text-sm text-gray-600 hover:underline">
              Forgot your password?
            </Link>
          </div>

          {/* Login Button */}
          <div className="grid gap-3">
            <button
              type="submit"
              className="h-12 rounded-[12px] bg-[#D96B7B] text-white font-bold text-lg tracking-tight hover:brightness-95 transition focus:outline-none focus:ring-4 focus:ring-[#D96B7B]/30"
            >
              Login
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
        </form>

        {/* Sign Up Link - Centered Below Button */}
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Don&apos;t have an account? </span>
          <Link href="/signup" className="text-[#D96B7B] font-semibold hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
