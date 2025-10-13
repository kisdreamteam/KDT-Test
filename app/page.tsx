import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#3B47E0]">
      <main>
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 sm:px-12 pt-6">
          <div className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#E79B92] select-none">
            KDT
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="rounded-full bg-[#DE8680] text-white font-semibold h-12 px-8 flex items-center shadow-sm hover:brightness-95 transition"
            >
              Log in
            </Link>
            <button className="rounded-full bg-[#8E96C6] text-white/90 font-semibold h-12 px-8 flex items-center shadow-sm hover:brightness-110 transition">
              Sign up
            </button>
          </div>
        </header>

        {/* Hero area */}
        <section className="px-6 sm:px-12 pt-10 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10">
            {/* Illustration area from local assets */}
            <div className="hidden lg:flex items-center justify-center">
              <Image
                src="/images/1Landing Page Image.png"
                alt="Illustration of two friendly characters on a stack of books with a paper plane"
                width={800}
                height={600}
                priority
                className="h-auto w-full max-w-[700px]"
              />
            </div>

            {/* Right content: Title and bullets */}
            <div className="text-white">
              <div className="leading-none">
                <p className="text-[56px] sm:text-[72px] font-extrabold">KIS</p>
                <p className="text-[56px] sm:text-[72px] font-extrabold">DreamTeam</p>
              </div>
              <ul className="mt-6 space-y-4 text-[#E79B92] text-2xl sm:text-3xl font-extrabold">
                <li className="list-disc list-inside">Classroom Management</li>
                <li className="list-disc list-inside">Seating Plans</li>
                <li className="list-disc list-inside">Teacher Resources</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
