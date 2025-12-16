import Image from 'next/image';
import { normalizeClassIconPath } from '@/lib/iconUtils';

interface WholeClassCardProps {
  classIcon: string;
  totalPoints: number;
  onClick: () => void;
}

export default function WholeClassCard({
  classIcon,
  totalPoints,
  onClick,
}: WholeClassCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-blue-300 font-spartan rounded-3xl hover:bg-blue-100 hover:rounded-3xl shadow-md p-6 overflow-hidden hover:shadow-lg transition-shadow duration-200 relative group cursor-pointer aspect-square flex flex-col"
      style={{ position: 'relative', zIndex: 1 }}
    >
      {/* Class Icon */}
      <div className="flex justify-center mb-4 pointer-events-none flex-shrink-0">
        <Image
          src={normalizeClassIconPath(classIcon)}
          alt="Whole Class icon"
          width={80}
          height={80}
          className="rounded-xl bg-[#FDF2F0]"
        />
      </div>

      {/* Card Title */}
      <div className="text-center mb-3 pointer-events-none flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">
          Whole Class
        </h3>
      </div>

      {/* Total Points */}
      <div className="text-center pointer-events-none mt-auto">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FDF2F0] text-red-400 text-xl font-large font-bold">
          {totalPoints}
        </div>
      </div>
    </div>
  );
}

