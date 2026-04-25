"use client";

import type { HTMLAttributes, ReactNode, MouseEvent, KeyboardEvent } from "react";
import IconSettingsWheel from "@/components/iconsCustom/iconSettingsWheel";

export type BaseCardVariant = "default" | "action";

export type BaseCardContentLayout = "center" | "space-between";

export type BaseCardProps = Omit<HTMLAttributes<HTMLDivElement>, "title" | "onClick" | "onKeyDown"> & {
  title: ReactNode;
  subtitle?: ReactNode;
  icon: ReactNode;
  variant?: BaseCardVariant;
  isSelected?: boolean;
  onSettingsClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  children?: ReactNode;
  topRightSlot?: ReactNode;
  titleClassName?: string;
  iconWrapperClassName?: string;
  contentLayout?: BaseCardContentLayout;
  subtitleClassName?: string;
};

const variantClass: Record<BaseCardVariant, string> = {
  default: "bg-white border-gray-200",
  action: "bg-blue-100/50 border-blue-200",
};

export default function BaseCard({
  title,
  subtitle,
  icon,
  variant = "default",
  isSelected = false,
  onSettingsClick,
  onClick,
  onKeyDown,
  children,
  topRightSlot,
  className = "",
  titleClassName = "",
  iconWrapperClassName = "",
  contentLayout = "center",
  subtitleClassName = "",
  ...rest
}: BaseCardProps) {
  const interactive = Boolean(onClick);
  const showDefaultGear = Boolean(onSettingsClick) && !topRightSlot;
  const justifyClass =
    contentLayout === "space-between"
      ? "justify-between !py-4 h-full"
      : "justify-center";

  return (
    <div
      {...rest}
      className={[
        "group relative w-full min-h-0 aspect-square rounded-2xl border p-4",
        "flex flex-col items-center font-spartan",
        justifyClass,
        "shadow-sm transition-all hover:scale-105",
        interactive ? "cursor-pointer" : "",
        isSelected ? "ring-4 ring-blue-500" : "",
        variantClass[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented || !onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {isSelected && (
        <div
          className={`absolute top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white shadow ${
            topRightSlot ? "left-2" : "right-2"
          }`}
          aria-hidden
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.242 2.242 6.542-6.54a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {topRightSlot && (
        <div className="absolute top-2 right-2 z-20" data-top-right-slot>
          {topRightSlot}
        </div>
      )}

      {showDefaultGear && (
        <button
          type="button"
          className="absolute top-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSettingsClick?.(e);
          }}
          aria-label="Settings"
        >
          <IconSettingsWheel className="h-5 w-5" />
        </button>
      )}

      <div
        className={["mb-1 flex w-full min-h-0 flex-shrink-0 flex-col items-center text-center", iconWrapperClassName]
          .filter(Boolean)
          .join(" ")}
      >
        {icon}
      </div>

      <div
        className={[
          "mb-1 w-full min-h-0 flex-shrink-0 break-words px-1 text-center",
          typeof title !== "string" ? titleClassName : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {typeof title === "string" ? (
          <h3
            className={["text-center text-lg font-semibold text-gray-800", titleClassName].filter(Boolean).join(" ")}
          >
            {title}
          </h3>
        ) : (
          title
        )}
      </div>

      {subtitle != null && subtitle !== "" && (
        <div
          className={["mb-1 w-full flex-shrink-0 text-center text-sm text-gray-600", subtitleClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {typeof subtitle === "string" ? <p>{subtitle}</p> : subtitle}
        </div>
      )}

      {children}
    </div>
  );
}
