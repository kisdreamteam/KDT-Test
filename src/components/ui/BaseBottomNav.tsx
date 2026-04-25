import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export type BaseBottomNavProps = Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> & {
  children: ReactNode;
  leftOffsetPx: number;
  style?: CSSProperties;
};

export default function BaseBottomNav({
  children,
  leftOffsetPx,
  className = "",
  style,
  ...rest
}: BaseBottomNavProps) {
  return (
    <div
      data-bottom-nav
      className={[
        "fixed bottom-0 z-50 font-spartan bg-white h-12 sm:h-14 md:h-16 lg:h-20",
        "flex items-center justify-start gap-2 sm:gap-4 md:gap-8 lg:gap-15",
        "pr-4 sm:pr-6 md:pr-8 lg:pr-10",
        "border-t border-[#4A3B8D] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.08)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ left: `${leftOffsetPx}px`, right: "0.5rem", ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
