interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function AuthCard({ children, className = '' }: AuthCardProps) {
  return (
    <div className={`bg-brand-cream rounded-[28px] shadow-xl relative ${className}`}>
      {children}
    </div>
  );
}

