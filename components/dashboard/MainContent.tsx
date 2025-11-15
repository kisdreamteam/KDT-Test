interface MainContentProps {
  children: React.ReactNode;
  currentClassName: string | null;
}

export default function MainContent({ children, currentClassName }: MainContentProps) {
  return (
    <div className={`flex-1 p-6 border-r-8 border-l-8 border-[#4A3B8D] mt-[120px] ${
      currentClassName ? 'bg-[#4A3B8D]' : 'bg-[#fcf1f0]'
    }`}>
      {children}
    </div>
  );
}

