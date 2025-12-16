'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import IconEye from '@/components/iconsCustom/iconEye';

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <form className="grid gap-6" onSubmit={async (e) => {
      e.preventDefault();
      setError('');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Login error:', error);
        setError(error.message ?? 'Failed to sign in. Please try again.');
        return;
      }
      setError('');
      router.push('/dashboard');
    }}>
      {/* Email Field */}
      <div className="grid gap-2">
        <label htmlFor="email" className="text-base font-semibold text-[24px] text-black font-spartan">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 rounded-[12px] border border-black/20 bg-white px-4 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-[#4A3B8D]/30 font-sans"
          placeholder=""
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Password Field */}
      <div className="grid gap-2">
        <label htmlFor="password" className="text-base font-semibold text-black text-[24px] font-spartan">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="h-12 w-full rounded-[12px] border border-black/20 bg-white px-4 pr-12 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-[#4A3B8D]/30 font-sans"
            placeholder=""
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black/80 "
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <IconEye hidden={showPassword} />
          </button>
        </div>
      </div>

      {/* Forgot Password Link - Left Aligned */}
      <div className="text-left">
        <Link href="#" className="text-[18px] text-sm text-gray-600 hover:underline font-spartan">
          Forgot your password?
        </Link>
      </div>

      {/* Login Button */}
      <div className="flex justify-center gap-3">
        <button
          type="submit"
          className="h-12 w-[750px] px-8 rounded-[12px] bg-[#D96B7B] text-white font-bold text-2xl tracking-tight hover:brightness-95 transition focus:outline-none focus:ring-4 focus:ring-[#D96B7B]/30 font-spartan"
        >
          Login
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </form>
  );
}

