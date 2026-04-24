interface IconCheckBoxProps {
  className?: string;
}

export default function IconCheckBox({ className = "w-3 h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 text-gray-400" }: IconCheckBoxProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/>
      <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

