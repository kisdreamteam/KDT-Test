interface FormLabelProps {
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}

export default function FormLabel({ htmlFor, children, className = '' }: FormLabelProps) {
  return (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  );
}

