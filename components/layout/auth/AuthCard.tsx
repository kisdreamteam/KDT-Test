interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function AuthCard({ children, className = '' }: AuthCardProps) {
  return (
    <div className={`bg-[#F5F5F5] rounded-[28px] shadow-xl relative ${className}`}>
      {children}
    </div>
  );
}

