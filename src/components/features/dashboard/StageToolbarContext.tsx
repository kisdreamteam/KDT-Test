'use client';

import { createContext, useContext } from 'react';
import type { CanvasToolbarAction } from '@/components/ui/CanvasToolbar';

export type StageToolbarConfig = {
  topActions: CanvasToolbarAction[];
  bottomActions: CanvasToolbarAction[];
  className?: string;
};

type StageToolbarContextType = {
  setToolbar: (config: StageToolbarConfig | null) => void;
};

const StageToolbarContext = createContext<StageToolbarContextType | null>(null);

export function StageToolbarProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: StageToolbarContextType;
}) {
  return <StageToolbarContext.Provider value={value}>{children}</StageToolbarContext.Provider>;
}

export function useStageToolbar() {
  const context = useContext(StageToolbarContext);
  if (!context) {
    throw new Error('useStageToolbar must be used within StageToolbarProvider');
  }
  return context;
}
