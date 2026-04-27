import Image from "next/image";
import Link from "next/link";


export default function LandingForm() {
  return (
    <>
      {/* Header */}
      <header className="w-full bg-brand-purple h-[150px] relative">
        <div
          className="absolute flex items-center bottom-3 right-2 gap-9 mr-90 font-spartan"
        >
          <Link
            href="/login"
            className="text-white font-semibold text-5xl hover:opacity-80 transition font-spartan"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="text-white font-semibold text-md text-5xl hover:opacity-80 transition font-spartan"
          >
            Signup
          </Link>
        </div>

        <div
          className="absolute bottom-8 translate-y-1/2 right-12 w-70 h-70 flex items-center justify-center overflow-hidden"
        >
          <Image
            src="/images/shared/profile-avatar.png"
            alt="kis-points-avatar"
            width={200}
            height={200}
            className="w-full h-full object-cover drop-shadow-lg"
          />
        </div>
      </header>

      <section className="pt-20">
        {/* Main - Content Container (nested flex-grid*/}
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-0">
          
          {/* Main - Character on the Left Side*/}
          <div className="flex items-center justify-center">
            <div className="bg-brand-cream rounded-2xl p-8 w-[650px] h-[650px] relative drop-shadow-lg">
              <Image
                src="/images/landing/LandingPageAvatar.png"
                alt="Friendly character with yellow crown and cheerful pose"
                width={1000}
                height={1000}
                priority
                className="absolute translate-x-1/8 max-w-[500px] w-full h-auto object-cover scale-145 drop-shadow-lg"
                style={{ top: "calc(0% + -30px)" }}
              />
            </div>
          </div>
    
          {/* Main - Text on the Right Side*/}
          <div>
            <h1 className="text-9xl leading-27.25 font-spartan font-bold mb-20 text-brand-purple">
              Let&apos;s get
              <br />
              started.
            </h1>
            <ul className="text-4xl leading-15.25 font-futura space-y-4 text-brand-pink">
              <li>Classroom Management</li>
              <li>AI Teacher Assistance</li>
              <li>Teacher Resources</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
