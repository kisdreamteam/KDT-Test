'use client';

import type { ReactNode, CSSProperties } from 'react';

export type CanvasToolbarAction = {
  id: string;
  icon: ReactNode;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  /** When true, uses active (e.g. purple) button styling */
  active?: boolean;
};

export type CanvasToolbarProps = {
  topActions: CanvasToolbarAction[];
  bottomActions: CanvasToolbarAction[];
  /** Extra class names for the outer pill */
  className?: string;
  /** aria-label for the toolbar region */
  'aria-label'?: string;
  /** Positioning: pass style from parent (fixed with insets or absolute with offsets) */
  style?: CSSProperties;
};

function buttonClass(action: CanvasToolbarAction): string {
  const base =
    'w-10 h-10 rounded-lg flex items-center justify-center shadow transition-colors';
  if (action.disabled) {
    return `${base} bg-white/60 cursor-not-allowed opacity-60`;
  }
  if (action.active) {
    return `${base} bg-purple-100 hover:bg-purple-200`;
  }
  if (action.id === 'teacher-view' && !action.active) {
    return `${base} bg-gray-200 hover:bg-gray-300 opacity-75`;
  }
  return `${base} bg-white/90 hover:bg-white`;
}

export default function CanvasToolbar({
  topActions,
  bottomActions,
  className = '',
  'aria-label': ariaLabel = 'Canvas actions',
  style,
}: CanvasToolbarProps) {
  return (
    <div
      className={`flex min-h-0 flex-col gap-2 overflow-hidden p-2 rounded-xl bg-white/80 z-10 border-2 border-black ${className}`}
      style={style}
      aria-label={ariaLabel}
    >
      {topActions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.disabled ? undefined : action.onClick}
          disabled={action.disabled}
          title={action.title}
          aria-label={action.title}
          className={buttonClass(action)}
        >
          {action.icon}
        </button>
      ))}
      <div className="min-h-0 flex-1" aria-hidden="true" />
      {bottomActions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={action.disabled ? undefined : action.onClick}
          disabled={action.disabled}
          title={action.title}
          aria-label={action.title}
          className={buttonClass(action)}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
}
