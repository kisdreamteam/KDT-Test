interface InlineErrorTextProps {
  children: React.ReactNode;
  className?: string;
}

export default function InlineErrorText({ children, className = '' }: InlineErrorTextProps) {
  return <p className={className}>{children}</p>;
}

