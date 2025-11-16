import LandingCharacter from "./LandingCharacter";
import LandingContent from "./LandingContent";

export default function LandingMain() {
  return (
    <section className="px-6 sm:px-60 py-15">
      <div className="grid grid-cols-1 
                      sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 
                      items-center 
                      sm:gap-5 md:gap-10 lg:gap-15">
        <LandingCharacter />
        <LandingContent />
      </div>
    </section>
  );
}

