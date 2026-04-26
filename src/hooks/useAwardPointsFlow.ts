'use client';

import { useCallback, useState } from 'react';

export interface AwardPointsInfo {
  studentAvatar: string;
  studentFirstName: string;
  points: number;
  categoryName: string;
  categoryIcon?: string;
}

export function useAwardPointsFlow() {
  const [awardInfo, setAwardInfo] = useState<AwardPointsInfo | null>(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const openAwardConfirmation = useCallback((info: AwardPointsInfo) => {
    setAwardInfo(info);
    setIsConfirmationModalOpen(true);
  }, []);

  const closeAwardConfirmation = useCallback(() => {
    setIsConfirmationModalOpen(false);
    setAwardInfo(null);
  }, []);

  return {
    awardInfo,
    isConfirmationModalOpen,
    openAwardConfirmation,
    closeAwardConfirmation,
  };
}
