"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState<string>("Ms.");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [role, setRole] = useState<string>("Teacher");

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const [emailError, setEmailError] = useState<string>("");
  const [roleError, setRoleError] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let hasError = false;

    setEmailError("");
    setRoleError("");

    if (!email.toLowerCase().endsWith("@kshcm.net")) {
      setEmailError("Email must be a valid @kshcm.net address.");
      hasError = true;
    }

    if (role === "Parent" || role === "Student") {
      setRoleError(
        `${role} is not available for sign-up yet. Please choose the correct option to continue.`
      );
      hasError = true;
    }

    if (password !== confirmPassword) {
      // Reuse emailError slot is not ideal; keeping UI minimal for now
      setEmailError("Passwords do not match.");
      hasError = true;
    }

    if (hasError) return;

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Supabase signUp error:", error);
      setMessage(error.message ?? "Failed to sign up. Please try again.");
      return;
    }

    setMessage("Success! Redirecting you to the login page...");
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  return (
    <div className="min-h-dvh w-full bg-[#4951ff] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-[28px] bg-white shadow-xl p-6 sm:p-10">
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
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 text-center flex-1">
            Create Your Account
          </h1>
          <div className="flex items-center gap-2 text-3xl" aria-hidden>
            <Image
              src="/images/2Login Page Image.png"
              alt="Playful characters welcoming users to sign up"
              width={400}
              height={400}
              priority
              className="h-auto w-[200px] sm:w-[260px] md:w-[300px]"
            />
          </div>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="sr-only">
              Title
            </label>
            <select
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Mr.</option>
              <option>Ms.</option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@kshcm.net"
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {emailError && (
              <p className="mt-2 text-sm text-red-600">{emailError}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pr-12 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon hidden={showPassword} />
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pr-12 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                <EyeIcon hidden={showConfirm} />
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled
              className="w-full rounded-xl border border-gray-200 bg-gray-100 text-gray-500 px-4 py-3 cursor-not-allowed rounded-xl"
            >
              <option>Teacher</option>
              <option>Parent</option>
              <option>Student</option>
            </select>
            {roleError && <p className="mt-2 text-sm text-red-600">{roleError}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="mt-2 w-full rounded-2xl bg-rose-400 hover:bg-rose-500 text-white font-semibold text-lg py-3 transition-colors"
          >
            Sign Up
          </button>
          {message && (
            <p className={`text-sm mt-2 ${message.startsWith("Success") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <span>Already have an account? </span>
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Log In
          </Link>
        </div>

        <div className="mt-6 text-center text-sm text-indigo-700">
          <span className="mr-2">🌐</span> English (US)
        </div>
      </div>
    </div>
  );
}
