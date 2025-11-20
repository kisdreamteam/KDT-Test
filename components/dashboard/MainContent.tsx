interface MainContentProps {
  children: React.ReactNode;
  currentClassName: string | null;
}

export default function MainContent({ children, currentClassName }: MainContentProps) {
  return (
    <div className={`w-full h-full px-6 pt-6 mt-[0] ${
      currentClassName ? 'bg-[#4A3B8D] pb-32' : 'bg-[#fcf1f0]'
    }`}>
      {children}
    </div>
  );
}

