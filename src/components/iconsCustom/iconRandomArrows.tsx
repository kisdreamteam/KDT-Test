interface IconRandomArrowsProps {
  className?: string;
}

export default function IconRandomArrows({ className = "w-3 h-3 sm:w-4 sm:h-4 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 text-gray-400" }: IconRandomArrowsProps) {
  return (
    <svg 
      className={className}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
      />
    </svg>
  );
}

