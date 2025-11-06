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
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
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
    setMessage("");

    // Combine first and last name
    const fullName = `${firstName} ${lastName}`.trim();

    // Append @kshcm.net if not already present
    const fullEmail = email.includes("@") ? email : `${email}@kshcm.net`;

    if (!fullEmail.toLowerCase().endsWith("@kshcm.net")) {
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
      setEmailError("Passwords do not match.");
      hasError = true;
    }

    if (hasError) return;

    const { error } = await supabase.auth.signUp({
      email: fullEmail,
      password,
      options: {
        data: {
          name: fullName,
          title: title,
          role: role
        }
      }
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
    <div className="min-h-screen w-full bg-[#4A3B8D] flex items-center justify-center p-6 relative">
      {/* Back Arrow - Top Left */}
      <Link
        href="/"
        className="absolute top-6 left-6 text-[#DE8680] hover:text-[#E89A94] transition-colors z-10"
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

      <div className="w-full max-w-7xl flex items-center gap-8">
        {/* Avatar on Left */}
        <div className="hidden lg:flex items-center justify-center flex-1 relative">
          <div className="relative">
            <Image
              src="/images/signup/signup-avatar.png"
              alt="Signup avatar character"
              width={600}
              height={600}
              priority
              className="h-auto w-full max-w-[600px]"
            />
          </div>
        </div>

        {/* Form Card on Right */}
        <div className="w-full lg:w-[600px] bg-[#F5F5F5] rounded-[28px] shadow-xl p-8 sm:p-10 relative">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black mb-2">
              Create your account
            </h1>
            <p className="text-base text-black/70">
              Enter your information to create a new account
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Title Dropdown */}
            <div className="relative">
              <select
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 pr-10 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-[#3B47E0]/30 appearance-none cursor-pointer"
              >
                <option>Mr.</option>
                <option>Ms.</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-black/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* First Name */}
            <div>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 text-[16px] text-black placeholder:text-black/50 outline-none focus:border-black/40 focus:ring-2 focus:ring-[#3B47E0]/30"
              />
            </div>

            {/* Last Name */}
            <div>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 text-[16px] text-black placeholder:text-black/50 outline-none focus:border-black/40 focus:ring-2 focus:ring-[#3B47E0]/30"
              />
            </div>

            {/* Email with @kshcm.net */}
            <div>
              <div className="relative">
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => {
                    // Remove @kshcm.net if user types it
                    let value = e.target.value.replace(/@kshcm\.net/gi, '');
                    setEmail(value);
                  }}
                  placeholder="Email address"
                  className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 pr-24 text-[16px] text-black placeholder:text-black/50 outline-none focus:border-black/40 focus:ring-2 focus:ring-[#3B47E0]/30"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[16px] text-black/70 pointer-events-none">
                  @kshcm.net
                </span>
              </div>
              {emailError && (
                <p className="mt-2 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 pr-12 text-[16px] text-black placeholder:text-black/50 outline-none focus:border-black/40 focus:ring-2 focus:ring-[#3B47E0]/30"
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

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 pr-12 text-[16px] text-black placeholder:text-black/50 outline-none focus:border-black/40 focus:ring-2 focus:ring-[#3B47E0]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black/80"
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  <EyeIcon hidden={showConfirm} />
                </button>
              </div>
            </div>

            {/* Role Dropdown */}
            <div className="relative">
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 pr-10 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-[#3B47E0]/30 appearance-none cursor-pointer"
              >
                <option>Teacher</option>
                <option>Parent</option>
                <option>Student</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-black/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {roleError && <p className="mt-2 text-sm text-red-600">{roleError}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-12 rounded-[24px] bg-[#DE8680] text-white font-bold text-lg tracking-tight hover:brightness-95 transition focus:outline-none focus:ring-4 focus:ring-[#DE8680]/30 mt-6"
            >
              Create Account
            </button>

            {message && (
              <p className={`text-sm text-center ${message.startsWith("Success") ? "text-green-600" : "text-red-600"}`}>
                {message}
              </p>
            )}
          </form>

          {/* Language Selector */}
          <div className="mt-6 text-center text-sm text-black/70 flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="h-5 w-5"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
              />
            </svg>
            <span>English (US)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
