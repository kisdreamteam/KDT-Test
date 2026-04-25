"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

const SCALE = 0.67;

export type ScaledGridFrameProps = {
  children: ReactNode;
  /** When this changes, layout is remeasured (e.g. student count or multi-select mode). */
  remeasureKey?: string | number;
  className?: string;
};

export default function ScaledGridFrame({ children, remeasureKey, className = "" }: ScaledGridFrameProps) {
  const scaledContainerRef = useRef<HTMLDivElement | null>(null);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const updateScaledHeight = () => {
      if (!scaledContainerRef.current) return;
      const unscaledHeight = scaledContainerRef.current.offsetHeight;
      setScaledHeight(unscaledHeight * SCALE);
    };

    updateScaledHeight();
    window.addEventListener("resize", updateScaledHeight);

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateScaledHeight) : null;
    if (observer && scaledContainerRef.current) {
      observer.observe(scaledContainerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateScaledHeight);
      observer?.disconnect();
    };
  }, [remeasureKey]);

  return (
    <div
      className={className}
      style={{
        height: scaledHeight ? `${scaledHeight}px` : undefined,
      }}
    >
      <div
        ref={scaledContainerRef}
        style={{
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
          width: `${100 / SCALE}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
