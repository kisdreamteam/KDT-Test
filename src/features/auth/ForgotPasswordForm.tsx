'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import FormLabel from '@/components/ui/FormLabel';
import TextInput from '@/components/ui/TextInput';
import PrimaryButton from '@/components/ui/PrimaryButton';
import InlineErrorText from '@/components/ui/InlineErrorText';
import AuthBackLink from '@/layouts/auth/AuthBackLink';
import AuthCard from '@/layouts/auth/AuthCard';
import AuthPageLayout from '@/layouts/auth/AuthPageLayout';

function ForgotHeader() {
  return (
    <>
      <div className="absolute top-0 right-7">
        <Image
          src="/images/login/login-logo.png"
          alt="Kis points logo"
          width={180}
          height={180}
          priority
          className="h-auto w-auto max-w-[180px]"
        />
      </div>

      <div className="mb-8 mt-2">
        <h1 className="text-6xl font-extrabold text-brand-purple font-spartan">
          Forgot password
        </h1>
        <p className="mt-4 text-lg text-black/70 font-spartan">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>
    </>
  );
}

export default function ForgotPasswordForm() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <AuthPageLayout>
      <AuthBackLink
        className="text-gray-300 flex-shrink-0"
        style={{
          left: 'max(calc(50% - 400px - 48px), 24px)',
          top: 'calc(50% - 220px)',
        }}
        href="/login"
        strokeWidth={3}
      />
      <AuthCard className="w-full max-w-[800px] px-8 py-10">
        <ForgotHeader />
        <form
          className="grid gap-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            setMessage('');
            setSubmitting(true);
            // Use current browser origin so redirect matches deployed URL (or localhost in dev).
            const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo,
            });
            setSubmitting(false);
            if (resetError) {
              setError(resetError.message ?? 'Could not send reset email. Try again.');
              return;
            }
            setMessage('Check your email for a link to reset your password.');
          }}
        >
          <div className="grid gap-2">
            <FormLabel
              htmlFor="forgot-email"
              className="text-base font-semibold text-[24px] text-black font-spartan"
            >
              Email address
            </FormLabel>
            <TextInput
              id="forgot-email"
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

          <div className="flex justify-center gap-3">
            <PrimaryButton
              type="submit"
              disabled={submitting}
              className="h-12 w-full max-w-[750px] px-8 rounded-[12px] bg-brand-pink text-white font-bold text-2xl tracking-tight hover:brightness-95 transition focus:outline-none focus:ring-4 focus:ring-brand-pink/30 font-spartan disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </PrimaryButton>
          </div>

          {error && (
            <InlineErrorText className="text-sm text-red-600 text-center">{error}</InlineErrorText>
          )}
          {message && (
            <p className="text-center text-sm text-brand-purple font-spartan">{message}</p>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-[18px]">
          <Link href="/login" className="text-brand-pink font-semibold font-spartan hover:underline">
            Back to login
          </Link>
        </div>
      </AuthCard>
    </AuthPageLayout>
  );
}
