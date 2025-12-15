import Link from 'next/link';
import LoginHeader from './LoginHeader';
import LoginForm from './LoginForm';
import LoginFooter from './LoginFooter';

export default function LoginApp() {
  return (
    <div className="min-h-screen w-full bg-[#4A3B8D] flex items-center justify-center p-6 font-spartan relative">
      {/* Back Arrow - On Purple Background, Left of Login */}
      <Link
        href="/"
        className="absolute text-gray-300 hover:text-[#E89A94] transition-colors flex-shrink-0 z-10"
        style={{
          left: 'max(calc(50% - 400px - 48px), 24px)', // Left of white box minus gap, with min padding
          top: 'calc(50% - 220px)', // Vertically aligned with Login text
        }}
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
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-8-8 8-8"
          />
        </svg>
      </Link>
      <div className="w-full max-w-[800px] bg-[#F5F5F5] rounded-[28px] shadow-xl px-8 py-10 relative">
        <LoginHeader />
        <LoginForm />
        <LoginFooter />
      </div>
    </div>
  );
}

