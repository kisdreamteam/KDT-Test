import Link from 'next/link';

export default function SignupHeader() {
  return (
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
  );
}

