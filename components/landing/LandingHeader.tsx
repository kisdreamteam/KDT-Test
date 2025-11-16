import Link from "next/link";
import Image from "next/image";

export default function LandingHeader() {
  return (
    <header className="w-full bg-[#4A3B8D] sm:h-[80px] md:h-[110px] lg:h-[150px] relative">
      <div className="absolute flex items-center
                      bottom-3 right-2 
                      sm:gap-5 md:gap-7 lg-gap-9
                      sm:mr-50 md:mr-70 lg:mr-90
                      font-spartan">
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

      <div className="absolute 
                      sm:bottom-4 md:bottom-6 lg:bottom-8 
                      translate-y-1/2 md:translate-y-1/2 lg:translate-y-1/2 
                      sm:right-6 md:right-8 lg:right-12 
                      sm:w-40 sm:h-40 md:w-50 md:h-50 lg:w-70 lg:h-70 
                      flex items-center 
                      justify-center overflow-hidden">
        <Image
          src="/images/shared/profile-avatar.png"
          alt="kis-points-avatar"
          width={200}
          height={200}
          className="w-full h-full object-cover"
        />
      </div>
    </header>
  );
}

