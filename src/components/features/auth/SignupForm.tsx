'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';
import TextInput from '@/components/ui/TextInput';
import SelectInput from '@/components/ui/SelectInput';
import PasswordInput from '@/components/ui/PasswordInput';
import PrimaryButton from '@/components/ui/PrimaryButton';
import InlineErrorText from '@/components/ui/InlineErrorText';
import AuthBackLink from '@/layouts/auth/AuthBackLink';
import AuthCard from '@/layouts/auth/AuthCard';
import Image from 'next/image';

function SignupHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black mb-2">
        Create your account
      </h1>
      <p className="text-base text-black/70">
        Enter your information to create a new account
      </p>
    </div>
  );
}

function SignupFooter() {
  return (
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
  );
}

function SignupAvatar() {
  return (
    <div className="hidden lg:flex items-center justify-center flex-1 relative translate-y-40">
      <div className="relative">
        <div 
          className="bg-[#cdd1d1] rounded-full p-8 w-[450px] h-[290px] relative shadow-xl" 
          style={{ borderRadius: '40% 30% 30% 30% / 40% 40% 40% 40%' }}
        >
          <Image
            src="/images/signup/signup-avatar.png"
            alt="Signup avatar character"
            width={600}
            height={600}
            priority
            className="absolute left-1/2 -translate-x-10/25 -translate-y-10/28 max-w-[450px] w-full h-auto object-cover scale-170"
            style={{ top: 'calc(-20% + 10px)' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function SignupForm() {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState<string>('Ms.');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [role, setRole] = useState<string>('Teacher');

  const [emailError, setEmailError] = useState<string>('');
  const [roleError, setRoleError] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let hasError = false;

    setEmailError('');
    setRoleError('');
    setMessage('');

    // Combine first and last name
    const fullName = `${firstName} ${lastName}`.trim();

    // Append @kshcm.net if not already present
    const fullEmail = email.includes('@') ? email : `${email}@kshcm.net`;

    if (!fullEmail.toLowerCase().endsWith('@kshcm.net')) {
      setEmailError('Email must be a valid @kshcm.net address.');
      hasError = true;
    }

    if (role === 'Parent' || role === 'Student') {
      setRoleError(
        `${role} is not available for sign-up yet. Please choose the correct option to continue.`
      );
      hasError = true;
    }

    if (password !== confirmPassword) {
      setEmailError('Passwords do not match.');
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
      console.error('Supabase signUp error:', error);
      setMessage(error.message ?? 'Failed to sign up. Please try again.');
      return;
    }

    setMessage('Success! Redirecting you to the login page...');
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  }

  return (
    <>
      <AuthBackLink className="top-6 left-6" />
      <div className="w-full max-w-7xl flex items-center gap-8">
        <SignupAvatar />
        
        {/* Form Card on Right */}
        <AuthCard className="w-full lg:w-[600px] p-8 sm:p-10">
          <SignupHeader />

          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Title Dropdown */}
            <div className="relative">
              <SelectInput
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 pr-10 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-[#3B47E0]/30 appearance-none cursor-pointer"
              >
                <option>Mr.</option>
                <option>Ms.</option>
              </SelectInput>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-black/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* First Name */}
            <div>
              <TextInput
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
              <TextInput
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
                <TextInput
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => {
                    // Remove @kshcm.net if user types it
                    const value = e.target.value.replace(/@kshcm\.net/gi, '');
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
                <InlineErrorText className="mt-2 text-sm text-red-600">{emailError}</InlineErrorText>
              )}
            </div>

            {/* Password */}
            <div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 pr-12 text-[16px] text-black placeholder:text-black/50 outline-none focus:border-black/40 focus:ring-2 focus:ring-[#3B47E0]/30"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 pr-12 text-[16px] text-black placeholder:text-black/50 outline-none focus:border-black/40 focus:ring-2 focus:ring-[#3B47E0]/30"
              />
            </div>

            {/* Role Dropdown */}
            <div className="relative">
              <SelectInput
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-12 rounded-[12px] border border-black/20 bg-white px-4 pr-10 text-[16px] text-black outline-none focus:border-black/40 focus:ring-2 focus:ring-[#3B47E0]/30 appearance-none cursor-pointer"
              >
                <option>Teacher</option>
                <option>Parent</option>
                <option>Student</option>
              </SelectInput>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-black/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {roleError && <InlineErrorText className="mt-2 text-sm text-red-600">{roleError}</InlineErrorText>}
            </div>

            {/* Submit Button */}
            <PrimaryButton
              type="submit"
              className="w-full h-12 rounded-[24px] bg-[#DE8680] text-white font-bold text-lg tracking-tight hover:brightness-95 transition focus:outline-none focus:ring-4 focus:ring-[#DE8680]/30 mt-6"
            >
              Create Account
            </PrimaryButton>

            {message && (
              <InlineErrorText className={`text-sm text-center ${message.startsWith('Success') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </InlineErrorText>
            )}
          </form>

          <SignupFooter />
        </AuthCard>
      </div>
    </>
  );
}
