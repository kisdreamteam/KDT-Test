 import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#FDFDFD]">
      <main>
        {/* Header bar with dark purple background */}
        <header className="w-full bg-[#4A3B8D] px-6 sm:px-12 py-8">
          <div className="flex items-center justify-end gap-6">
            <Link
              href="/login"
              className="text-white font-semibold text-lg hover:opacity-80 transition"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-white font-semibold text-lg hover:opacity-80 transition"
            >
              Sign up
            </Link>
            {/* Small character icon in top-right */}
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <Image
                src="/images/landing/LandingPageAvatar.png"
                alt="Character avatar"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Main content area */}
        <section className="px-6 sm:px-12 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
            {/* Left section - Character illustration */}
            <div className="flex items-center justify-center">
              <div className="bg-[#FFF5F5] rounded-2xl p-8 w-full max-w-xl">
                <div className="flex items-center justify-center">
                  <Image
                    src="/images/landing/LandingPageAvatar.png"
                    alt="Friendly character with yellow crown and cheerful pose"
                    width={400}
                    height={400}
                    priority
                    className="h-auto w-full max-w-[500px]"
                  />
                </div>
              </div>
            </div>

            {/* Right section - Text content */}
            <div className="text-[#4A3B8D]">
              <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-8">
                Let&apos;s get<br />started.
              </h1>
              <ul className="space-y-4 text-[#D98B8B] text-xl sm:text-2xl font-semibold">
                <li>Classroom Management</li>
                <li>AI Teacher Assistance</li>
                <li>Teacher Resources</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
