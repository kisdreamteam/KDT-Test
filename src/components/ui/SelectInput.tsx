import type { SelectHTMLAttributes } from 'react';

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  children: React.ReactNode;
}

export default function SelectInput({ className = '', children, ...props }: SelectInputProps) {
  return (
    <select className={className} {...props}>
      {children}
    </select>
  );
}

