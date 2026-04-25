import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

const defaultGridStyle: CSSProperties = {
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
};

export type CardsGridProps = Omit<HTMLAttributes<HTMLDivElement>, "style"> & {
  children: ReactNode;
  /** Merged with default `grid gap-6` */
  className?: string;
  /** Merged with default `gridTemplateColumns` */
  style?: CSSProperties;
};

export default function CardsGrid({ children, className = "", style, ...rest }: CardsGridProps) {
  return (
    <div
      {...rest}
      className={["grid w-full min-w-0 gap-6", className].filter(Boolean).join(" ")}
      style={{ ...defaultGridStyle, ...style }}
    >
      {children}
    </div>
  );
}
