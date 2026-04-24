import Link from 'next/link';

interface AuthBackLinkProps {
  href?: string;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}

export default function AuthBackLink({
  href = '/',
  className = '',
  style,
  strokeWidth = 2,
}: AuthBackLinkProps) {
  return (
    <Link
      href={href}
      className={`absolute text-[#DE8680] hover:text-[#E89A94] transition-colors z-10 ${className}`}
      style={style}
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
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19l-8-8 8-8"
        />
      </svg>
    </Link>
  );
}

