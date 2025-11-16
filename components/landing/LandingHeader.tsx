import Link from "next/link";
import Image from "next/image";

export default function LandingHeader() {
  return (
    <header className="w-full bg-[#4A3B8D] sm:h-[100px] md:h-[150px] lg:h-[200px] relative">
      <div className="absolute bottom-3 right-6 sm:right-0 flex items-center gap-7 mr-90 font-spartan">
        <Link
          href="/login"
          className="text-white font-semibold text-5xl hover:opacity-80 transition font-spartan"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="text-white font-semibold text-5xl hover:opacity-80 transition font-spartan"
        >
          Signup
        </Link>
      </div>

      <div className="absolute 
                      sm:bottom-4 md:bottom-6 lg:bottom-8 
                      sm:translate-y-1/2 md:translate-y-1/2 lg:translate-y-1/2 
                      sm:right-6 md:right-12 lg:right-12 
                      sm:w-40 sm:h-40 md:w-50 md:h-50 lg:w-70 lg:h-70 
                      flex items-center 
                      justify-center overflow-hidden">
        <Image
          src="/images/shared/profile-avatar.png"
          alt="kis-points-avatar"
          width={400}
          height={400}
          className="w-full h-full object-cover"
        />
      </div>
    </header>
  );
}

