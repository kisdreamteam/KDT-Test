import LandingHeader from "@/components/features/landing/LandingHeader";
import LandingMain from "@/components/features/landing/LandingMain";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <main>
        <LandingHeader />
        <LandingMain />
      </main>
    </div>
  );
}