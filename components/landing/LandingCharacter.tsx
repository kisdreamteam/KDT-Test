import Image from "next/image";

export default function LandingCharacter() {
  return (
    <div className="flex items-center justify-center">
      <div className="bg-[#F9EFF0] rounded-2xl p-8 
                      lg:w-[650px] lg:h-[650px] 
                      md:w-[400px] md:h-[400px]
                      sm:w-[200px] sm:h-[200px]
                      relative">
        <Image
          src="/images/landing/LandingPageAvatar.png"
          alt="Friendly character with yellow crown and cheerful pose"
          width={1000}
          height={1000}
          priority
          className="absolute left-1/2 -translate-x-1/2 max-w-[500px] w-full h-auto object-cover scale-145"
          style={{ top: 'calc(0% + -30px)' }}
        />
      </div>
    </div>
  );
}

