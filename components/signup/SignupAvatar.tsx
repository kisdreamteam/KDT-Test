import Image from 'next/image';

export default function SignupAvatar() {
  return (
    <div className="hidden lg:flex items-center justify-center flex-1 relative translate-y-40">
      <div className="relative">
        <div 
          className="bg-[#cdd1d1] rounded-full p-8 w-[450px] h-[290px] relative shadow-xl" 
          style={{ borderRadius: '40% 30% 30% 30% / 40% 40% 40% 40%' }}
        >
          <Image
            src="/images/signup/signup-avatar.png"
            alt="Signup avatar character"
            width={600}
            height={600}
            priority
            className="absolute left-1/2 -translate-x-10/25 -translate-y-10/28 max-w-[450px] w-full h-auto object-cover scale-170"
            style={{ top: 'calc(-20% + 10px)' }}
          />
        </div>
      </div>
    </div>
  );
}

