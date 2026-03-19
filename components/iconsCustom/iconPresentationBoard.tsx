interface IconPresentationBoardProps {
  className?: string;
  strokeWidth?: number;
}

/** Person presenting at a board (figure with pointer, rectangular board). */
export default function IconPresentationBoard({
  className = 'w-6 h-6 text-gray-600',
  strokeWidth = 2,
}: IconPresentationBoardProps) {
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
      {/* Board (right) */}
      <rect x={13} y={2} width={9} height={20} rx={1.5} />
      {/* Head */}
      <circle cx={6} cy={6} r={2.5} />
      {/* Torso */}
      <path d="M4 10h4v5H4z" />
      {/* Legs */}
      <path d="M5.5 15v4M8.5 15v4" />
      {/* Arm with pointer to board */}
      <path d="M9 10l5-6 2 2" />
    </svg>
  );
}
