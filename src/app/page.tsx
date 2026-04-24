import LandingHeader from "@/components/landing/LandingHeader";
import LandingMain from "@/components/landing/LandingMain";

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