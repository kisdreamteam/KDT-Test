import Link from 'next/link';
import Image from 'next/image';

export default function LoginHeader() {
  return (
    <>
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
    </>
  );
}

