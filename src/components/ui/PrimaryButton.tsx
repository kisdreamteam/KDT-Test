import type { ButtonHTMLAttributes } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
}

export default function PrimaryButton({ className = '', children, ...props }: PrimaryButtonProps) {
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
}

