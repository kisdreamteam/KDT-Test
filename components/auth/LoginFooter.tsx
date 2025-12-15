import Link from 'next/link';

export default function LoginFooter() {
  return (
    <div className="mt-6 text-center text-sm text-[18px]">
      <span className="text-gray-600 font-spartan">Don&apos;t have an account? </span>
      <Link href="/signup" className="text-[#D96B7B] text-[18px] font-semibold font-spartan hover:underline">
        Sign up
      </Link>
    </div>
  );
}

