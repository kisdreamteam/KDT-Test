interface IconDocumentClockProps {
  className?: string;
  strokeWidth?: number;
}

/** Document with clock (history / past records). */
export default function IconDocumentClock({
  className = 'w-6 h-6 text-gray-600',
  strokeWidth = 2,
}: IconDocumentClockProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    >
      {/* Document body (rounded rect) */}
      <rect x={3} y={2} width={14} height={20} rx={2} />
      {/* Text lines inside document */}
      <path d="M6 7h8M6 11h6M6 15h7" />
      {/* Clock circle overlapping bottom-right */}
      <circle cx={17} cy={18} r={4} />
      {/* Clock hand pointing to 3 o'clock */}
      <path d="M17 18l2.5 0" />
    </svg>
  );
}
