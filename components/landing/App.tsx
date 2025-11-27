import LandingHeader from "./LandingHeader";
import LandingMain from "./LandingMain";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <main>
        <LandingHeader />
        <LandingMain />
      </main>
    </div>
  );
}

