import Link from 'next/link';
import Image from 'next/image';

export default function LoginHeader() {
  return (
    <>
      {/* Logo - Top Right */}
      <div className="absolute top-0 right-7">
        <Image
          src="/images/login/login-logo.png"
          alt="Kis points logo"
          width={180}
          height={180}
          priority
          className="h-auto w-auto max-w-[180px]"
        />
      </div>

      {/* Login Title */}
      <div className="mb-8 mt-2">
        <h1 className="text-6xl font-extrabold text-[#4A3B8D] font-spartan">
          Login
        </h1>
      </div>
    </>
  );
}

