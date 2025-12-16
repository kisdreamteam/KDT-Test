import React from 'react';

interface BotNavGrayButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  enabled?: boolean;
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  wrapperRef?: React.RefObject<HTMLDivElement | null>;
  stopPropagation?: boolean;
}

export default function BotNavGrayButton({
  icon,
  label,
  onClick,
  enabled = true,
  className = '',
  iconClassName = '',
  labelClassName = '',
  wrapperRef,
  stopPropagation = false,
}: BotNavGrayButtonProps) {
  const baseClassName = 'w-16 sm:w-24 md:w-32 lg:w-[200px] p-1 sm:p-2 md:p-2.5 lg:p-3 transition-colors flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0';
  
  const buttonClassName = enabled
    ? `${baseClassName} bg-white text-white hover:bg-pink-50 hover:shadow-sm cursor-pointer ${className}`
    : `${baseClassName} bg-gray-100 cursor-not-allowed opacity-50 ${className}`;
  
  const defaultLabelClassName = 'font-semibold text-xs sm:text-sm md:text-base lg:text-base hidden sm:inline';
  const finalLabelClassName = enabled
    ? `${defaultLabelClassName} text-gray-400 ${labelClassName}`
    : `${defaultLabelClassName} text-gray-300 ${labelClassName}`;

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    if (enabled) {
      onClick(e);
    }
  };

  const buttonContent = (
    <div 
      onClick={handleClick}
      className={buttonClassName}
    >
      {icon}
      <h2 className={finalLabelClassName}>{label}</h2>
    </div>
  );

  if (wrapperRef) {
    return (
      <div className="relative flex-shrink-0" ref={wrapperRef}>
        {buttonContent}
      </div>
    );
  }

  return buttonContent;
}

