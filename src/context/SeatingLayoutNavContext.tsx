'use client';

import { createContext, useContext, ReactNode } from 'react';

export interface SeatingChartLayoutItem {
  id: string;
  name: string;
  class_id: string;
  created_at: string;
}

export interface SeatingLayoutNavData {
  layouts: SeatingChartLayoutItem[];
  selectedLayoutId: string | null;
  onSelectLayout: (layoutId: string) => void;
  onAddLayout: () => void;
  onEditLayout: (layoutId: string, layoutName: string, e: React.MouseEvent) => void;
  onDeleteLayout: (layoutId: string, layoutName: string, e: React.MouseEvent) => void;
  isLoadingLayouts: boolean;
}

type SetSeatingLayoutData = (data: SeatingLayoutNavData | null) => void;

const SeatingLayoutNavContext = createContext<SetSeatingLayoutData | undefined>(undefined);

export function SeatingLayoutNavProvider({
  children,
  setSeatingLayoutData,
}: {
  children: ReactNode;
  setSeatingLayoutData: SetSeatingLayoutData;
}) {
  return (
    <SeatingLayoutNavContext.Provider value={setSeatingLayoutData}>
      {children}
    </SeatingLayoutNavContext.Provider>
  );
}

export function useSeatingLayoutNav() {
  const context = useContext(SeatingLayoutNavContext);
  if (context === undefined) {
    throw new Error('useSeatingLayoutNav must be used within a SeatingLayoutNavProvider');
  }
  return context;
}
