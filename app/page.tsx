import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#FDFDFD]">
      <main>
        {/* Header bar with dark purple background */}
        <header className="w-full bg-[#4A3B8D] px-6 sm:px-12 py-18 relative">
          {/* <div className="flex items-center justify-end gap-6 mr-90 mt-10"> */}
          <div className="absolute bottom-4 right-6 sm:right-8 flex items-center gap-6 mr-90">
            <Link
              href="/login"
              className="text-white font-semibold text-5xl hover:opacity-80 transition"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-white font-semibold text-5xl hover:opacity-80 transition"
            >
              Sign up
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


        {/* Main content area */}
        <section className="px-6 sm:px-12 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12">   
            {/* Left section - Character illustration */}
            <div className="flex items-center justify-center">
              {/* <div className="bg-[#FFF5F5] rounded-2xl p-8 w-full max-w-sm lg:max-w-md h-[650px] relative"> */}
              <div className="bg-[#F9EFF0] rounded-2xl p-8 w-[650] h-[650px] relative">
                <Image
                  src="/images/landing/LandingPageAvatar.png"
                  alt="Friendly character with yellow crown and cheerful pose"
                  width={1000}
                  height={1000}
                  priority
                  className="absolute left-1/2 -translate-x-1/2 max-w-[450px] w-full h-auto object-cover scale-145"
                  style={{ top: 'calc(10% + 10px)' }}
                />
              </div>
            </div>

            {/* Right section - Text content */}
            <div className="text-[#4A3B8D]">
              <h1 className="text-5xl sm:text-7xl font-bold leading-tight mb-8 font-spartan"> {/* <-- Fixed 'text-10xl' */}
                Let&apos;s get
                <br />
                started.
              </h1>
              <ul className="space-y-4 text-[#D98B8B] text-3xl sm:text-4xl font-semibold">
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