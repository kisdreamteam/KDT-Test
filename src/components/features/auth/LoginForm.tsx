'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';
import FormLabel from '@/components/ui/FormLabel';
import TextInput from '@/components/ui/TextInput';
import PasswordInput from '@/components/ui/PasswordInput';
import PrimaryButton from '@/components/ui/PrimaryButton';
import InlineErrorText from '@/components/ui/InlineErrorText';

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
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
        <FormLabel htmlFor="email" className="text-base font-semibold text-[24px] text-black font-spartan">
          Email address
        </FormLabel>
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 rounded-[12px] border border-black/20 bg-white px-4 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-brand-purple/30 font-sans"
          placeholder=""
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Password Field */}
      <div className="grid gap-2">
        <FormLabel htmlFor="password" className="text-base font-semibold text-black text-[24px] font-spartan">
          Password
        </FormLabel>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          className="h-12 w-full rounded-[12px] border border-black/20 bg-white px-4 pr-12 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-brand-purple/30 font-sans"
          placeholder=""
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {/* Forgot Password Link - Left Aligned */}
      <div className="text-left">
        <Link href="#" className="text-[18px] text-sm text-gray-600 hover:underline font-spartan">
          Forgot your password?
        </Link>
      </div>

      {/* Login Button */}
      <div className="flex justify-center gap-3">
        <PrimaryButton
          type="submit"
          className="h-12 w-[750px] px-8 rounded-[12px] bg-brand-pink text-white font-bold text-2xl tracking-tight hover:brightness-95 transition focus:outline-none focus:ring-4 focus:ring-brand-pink/30 font-spartan"
        >
          Login
        </PrimaryButton>
      </div>

      {error && (
        <InlineErrorText className="text-sm text-red-600 text-center">{error}</InlineErrorText>
      )}
    </form>
  );
}
