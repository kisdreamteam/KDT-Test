"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";


export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[#3B47E0] flex items-center justify-center p-6">
      <div className="w-full max-w-[720px] bg-white/95 rounded-[28px] shadow-xl border border-black/5 px-6 sm:px-10 py-10 relative">
        <div className="flex items-start justify-between gap-4 mb-6 sm:mb-8">
          <Link
            href="/"
            className="text-pink-400 hover:text-pink-500 transition-colors"
            aria-label="Go back"
          >
            {/* simple back arrow */}
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
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black text-center flex-1">
            Log in to KDT
          </h1>
          <div className="flex items-center gap-2 text-3xl" aria-hidden>
            <Image
              src="/images/2Login Page Image.png"
              alt="Playful characters welcoming users to log in"
              width={400}
              height={400}
              priority
              className="h-auto w-[200px] sm:w-[260px] md:w-[300px]"
            />
          </div>
        </div>

        <form className="mt-8 grid gap-6">
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
              className="h-12 rounded-[12px] border border-black/20 px-4 text-[16px] outline-none focus:border-black/40 focus:ring-2 focus:ring-[#3B47E0]/30"
              placeholder="you@example.com"
            />
          </div>

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
                className="h-12 w-full rounded-[12px] border border-black/20 px-4 pr-12 text-[16px] outline-none focus:border-black/40 focus:ring-2 focus:ring-[#3B47E0]/30"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black/80"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <span className="text-lg" aria-hidden>
                  {showPassword ? "🙈" : "👁️"}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-black">
              <input type="checkbox" className="h-4 w-4 rounded border-black/30" />
              Remember me
            </label>
            <Link href="#" className="text-sm font-semibold text-[#3B47E0] hover:underline">
              Forgot your password?
            </Link>
          </div>

          <div className="grid gap-3">
            <button
              type="submit"
              className="h-12 rounded-[24px] bg-[#DE8680] text-white font-bold text-lg tracking-tight hover:brightness-95 transition focus:outline-none focus:ring-4 focus:ring-[#DE8680]/30"
            >
              Log in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


