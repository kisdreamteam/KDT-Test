import Link from 'next/link';

export default function LoginFooter() {
  return (
    <div className="mt-6 text-center text-sm">
      <span className="text-gray-600">Don&apos;t have an account? </span>
      <Link href="/signup" className="text-[#D96B7B] font-semibold hover:underline">
        Sign up
      </Link>
    </div>
  );
}

