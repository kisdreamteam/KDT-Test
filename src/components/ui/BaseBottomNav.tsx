import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export type BaseBottomNavProps = Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> & {
  children: ReactNode;
  style?: CSSProperties;
};

export default function BaseBottomNav({
  children,
  className = "",
  style,
  ...rest
}: BaseBottomNavProps) {
  return (
    <div
      data-bottom-nav
      className={[
        "w-full h-full font-spartan bg-white",
        "flex items-center justify-start gap-2 sm:gap-4 md:gap-8 lg:gap-15",
        "px-4 sm:px-6 md:px-8 lg:px-10",
        "border-t border-brand-purple shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.08)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}
