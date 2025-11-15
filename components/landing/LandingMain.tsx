import LandingCharacter from "./LandingCharacter";
import LandingContent from "./LandingContent";

export default function LandingMain() {
  return (
    <section className="px-6 sm:px-60 py-15">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-0">
        <LandingCharacter />
        <LandingContent />
      </div>
    </section>
  );
}

