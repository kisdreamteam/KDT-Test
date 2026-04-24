'use client';

import { useState } from 'react';
import IconEye from '@/components/iconsCustom/iconEye';
import TextInput from '@/components/ui/TextInput';

interface PasswordInputProps {
  id: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  className?: string;
  toggleButtonClassName?: string;
}

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  className = '',
  toggleButtonClassName = 'absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black/80',
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <TextInput
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className={className}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className={toggleButtonClassName}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        <IconEye hidden={visible} />
      </button>
    </div>
  );
}

