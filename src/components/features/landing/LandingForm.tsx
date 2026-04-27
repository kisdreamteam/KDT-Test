import Image from "next/image";
import Link from "next/link";

function LandingContent() {
  return (
    <div className="text-brand-purple">
      <h1
        className=" lg:text-9xl md:text-7xl sm:text-5xl 
                      lg:leading-27.25 md:leading-22.25 sm:leading-16.25 
                      font-bold mb-9 font-spartan -translate-y-10"
      >
        Let&apos;s get
        <br />
        started.
      </h1>
      <ul
        className="space-y-4 text-[#D98B8B] 
                      lg:text-4xl md:text-2xl sm:text-xl 
                      lg:leading-15.25 md:leading-5.25 sm:leading-4.25 
                      font-futura"
      >
        <li>Classroom Management</li>
        <li>AI Teacher Assistance</li>
        <li>Teacher Resources</li>
      </ul>
    </div>
  );
}

function LandingCharacter() {
  return (
    <div className="flex items-center justify-center">
      <div
        className="bg-brand-cream rounded-2xl p-8 
                      lg:w-[650px] lg:h-[650px] 
                      md:w-[400px] md:h-[400px]
                      sm:w-[200px] sm:h-[200px]
                      relative"
      >
        <Image
          src="/images/landing/LandingPageAvatar.png"
          alt="Friendly character with yellow crown and cheerful pose"
          width={1000}
          height={1000}
          priority
          className="absolute left-11/20 -translate-x-1/2 max-w-[500px] w-full h-auto object-cover scale-145"
          style={{ top: "calc(0% + -30px)" }}
        />
      </div>
    </div>
  );
}

export default function LandingForm() {
  return (
    <>
      <header className="w-full bg-brand-purple sm:h-[80px] md:h-[110px] lg:h-[150px] relative">
        <div
          className="absolute flex items-center
                      bottom-3 right-2 
                      sm:gap-5 md:gap-7 lg-gap-9
                      sm:mr-50 md:mr-70 lg:mr-90
                      font-spartan"
        >
          <Link
            href="/login"
            className="text-white font-semibold 
                    sm:text-3xl md:text-4xl lg:text-5xl 
                    hover:opacity-80 transition font-spartan"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="text-white font-semibold text-md 
                    sm:text-3xl md:text-4xl lg:text-5xl 
                    hover:opacity-80 transition font-spartan"
          >
            Signup
          </Link>
        </div>

        <div
          className="absolute 
                      sm:bottom-4 md:bottom-6 lg:bottom-8 
                      translate-y-1/2 md:translate-y-1/2 lg:translate-y-1/2 
                      sm:right-6 md:right-8 lg:right-12 
                      sm:w-40 sm:h-40 md:w-50 md:h-50 lg:w-70 lg:h-70 
                      flex items-center 
                      justify-center overflow-hidden"
        >
          <Image
            src="/images/shared/profile-avatar.png"
            alt="kis-points-avatar"
            width={200}
            height={200}
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      <section className="pt-20">
        <div
          className="grid grid-cols-1 
                      sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 
                      items-center 
                      sm:gap-50 md:gap-10 lg:gap-0"
        >
          <LandingCharacter />
          <LandingContent />
        </div>
      </section>
    </>
  );
}
