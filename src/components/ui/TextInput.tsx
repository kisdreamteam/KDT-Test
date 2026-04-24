import type { InputHTMLAttributes } from 'react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function TextInput({ className = '', ...props }: TextInputProps) {
  return <input className={className} {...props} />;
}

