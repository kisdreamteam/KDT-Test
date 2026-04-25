interface AuthPageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function AuthPageLayout({ children, className = '' }: AuthPageLayoutProps) {
  return (
    <div className={`min-h-screen w-full bg-brand-purple flex items-center justify-center p-6 font-spartan relative ${className}`}>
      {children}
    </div>
  );
}

