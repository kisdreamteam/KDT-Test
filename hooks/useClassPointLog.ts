'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Student } from '@/lib/types';
import { fetchPointLogRowsForStudents } from '@/api/points';

export type PointLogRow = {
  id: string;
  studentName: string;
  reason: string;
  points: number;
  createdAt: string;
};

export function formatPointLogDateDDMMYYYY(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  return `${day}/${month}/${year}`;
}

export function useClassPointLog(classId: string | undefined, students: Student[]) {
  const [isPointLogOpen, setIsPointLogOpen] = useState(false);
  const [isPointLogLoading, setIsPointLogLoading] = useState(false);
  const [pointLogError, setPointLogError] = useState<string | null>(null);
  const [pointLogRows, setPointLogRows] = useState<PointLogRow[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [logTotalCount, setLogTotalCount] = useState(0);

  const fetchPointLogRows = useCallback(async () => {
    if (!classId) return;
    try {
      setIsPointLogLoading(true);
      setPointLogError(null);

      const studentNameMap = new Map<string, string>();
      const studentIds = students.map((s) => {
        const first = s.first_name ?? '';
        const last = s.last_name ?? '';
        studentNameMap.set(s.id, `${first} ${last}`.trim() || 'Unknown student');
        return s.id;
      });

      if (studentIds.length === 0) {
        setPointLogRows([]);
        setLogTotalCount(0);
        return;
      }

      const mergedRows = await fetchPointLogRowsForStudents({
        studentIds,
        studentNameMap,
      });
      setPointLogRows(mergedRows);
      setLogTotalCount(mergedRows.length);
    } catch (err) {
      console.error('Unexpected error fetching point log rows:', err);
      setPointLogError('Failed to load point log.');
      setPointLogRows([]);
      setLogTotalCount(0);
    } finally {
      setIsPointLogLoading(false);
    }
  }, [classId, students]);

  useEffect(() => {
    if (isPointLogOpen) {
      setLogPage(1);
      fetchPointLogRows();
    }
  }, [isPointLogOpen, fetchPointLogRows]);

  const totalPages = Math.max(1, Math.ceil(logTotalCount / rowsPerPage));
  const safeLogPage = Math.min(Math.max(logPage, 1), totalPages);
  const pagedPointLogRows = useMemo(() => {
    const start = (safeLogPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return pointLogRows.slice(start, end);
  }, [pointLogRows, rowsPerPage, safeLogPage]);

  return {
    isPointLogOpen,
    setIsPointLogOpen,
    isPointLogLoading,
    pointLogError,
    pointLogRows,
    logPage,
    setLogPage,
    rowsPerPage,
    setRowsPerPage,
    logTotalCount,
    totalPages,
    safeLogPage,
    pagedPointLogRows,
    fetchPointLogRows,
  };
}
