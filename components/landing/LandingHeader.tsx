import Link from "next/link";
import Image from "next/image";

export default function LandingHeader() {
  return (
    <header className="w-full bg-[#4A3B8D] px-6 sm:px-12 py-18 relative">
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

      <div className="absolute bottom-8 translate-y-1/2 right-6 sm:right-12 w-70 h-70 flex items-center justify-center overflow-hidden">
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

