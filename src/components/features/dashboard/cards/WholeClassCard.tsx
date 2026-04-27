import { normalizeClassIconPath } from "@/lib/iconUtils";
import BaseCard from "@/components/ui/BaseCard";

interface WholeClassCardProps {
  classIcon: string | null;
  totalPoints: number;
  onClick: () => void;
}

export default function WholeClassCard({
  classIcon,
  totalPoints,
  onClick,
}: WholeClassCardProps) {
  return (
    <BaseCard
      variant="action"
      contentLayout="space-between"
      title="Whole Class"
      onClick={onClick}
      className="overflow-hidden !bg-blue-300 !border-blue-200 hover:shadow-md hover:!bg-blue-200"
      iconWrapperClassName="!mb-0"
      titleClassName="!mb-0"
      icon={
        classIcon ? (
          <img
            src={normalizeClassIconPath(classIcon)}
            alt="Whole Class icon"
            width={80}
            height={80}
            className="rounded-xl bg-[#FDF2F0]"
            decoding="async"
          />
        ) : (
          <div className="w-[80px] h-[80px] rounded-full bg-gray-200 animate-pulse" aria-label="Loading class icon" />
        )
      }
    >
      <div className="pointer-events-none w-full text-center">
        <div className="inline-flex items-center rounded-full bg-[#FDF2F0] px-3 py-1 text-xl font-bold text-red-400">
          {totalPoints}
        </div>
      </div>
    </BaseCard>
  );
}
