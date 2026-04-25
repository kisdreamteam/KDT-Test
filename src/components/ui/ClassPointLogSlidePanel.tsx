'use client';

import type { CSSProperties, Dispatch, SetStateAction } from 'react';
import type { PointLogRow } from '@/hooks/useClassPointLog';
import { formatPointLogDateDDMMYYYY } from '@/hooks/useClassPointLog';

export type ClassPointLogSlidePanelProps = {
  isOpen: boolean;
  position: 'fixed' | 'absolute';
  /** Distance from right edge (px), e.g. 72 to clear the canvas toolbar */
  rightPx: number;
  topPx: number;
  bottomPx: number;
  zIndex?: number;
  logTotalCount: number;
  pointLogError: string | null;
  isPointLogLoading: boolean;
  pagedRows: PointLogRow[];
  safeLogPage: number;
  totalPages: number;
  rowsPerPage: number;
  setLogPage: Dispatch<SetStateAction<number>>;
  setRowsPerPage: Dispatch<SetStateAction<number>>;
};

export default function ClassPointLogSlidePanel({
  isOpen,
  position,
  rightPx,
  topPx,
  bottomPx,
  zIndex = 20,
  logTotalCount,
  pointLogError,
  isPointLogLoading,
  pagedRows,
  safeLogPage,
  totalPages,
  rowsPerPage,
  setLogPage,
  setRowsPerPage,
}: ClassPointLogSlidePanelProps) {
  const style: CSSProperties = {
    position,
    top: topPx,
    bottom: bottomPx,
    right: rightPx,
    width: 'min(720px, calc(100% - 160px))',
    transform: isOpen ? 'translateX(0)' : 'translateX(110%)',
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? 'auto' : 'none',
    zIndex,
  };

  return (
    <div className="transition-all duration-300 ease-out" style={style}>
      <div className="h-full rounded-xl border-2 border-black bg-white shadow-lg overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Point Log</h3>
          <span className="text-sm text-gray-500">{logTotalCount} records</span>
        </div>

        {pointLogError && (
          <div className="px-4 py-2 text-sm text-red-600 border-b border-red-100 bg-red-50">
            {pointLogError}
          </div>
        )}

        <div className="grid grid-cols-[1.3fr_1.6fr_1fr_0.7fr] gap-3 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-200">
          <div>Student</div>
          <div>Point category / reason</div>
          <div>Awarded date</div>
          <div className="text-right">Points</div>
        </div>

        <div className="flex-1 overflow-auto">
          {isPointLogLoading ? (
            <div className="h-full flex items-center justify-center text-gray-500">Loading point log...</div>
          ) : pagedRows.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">No point log entries yet.</div>
          ) : (
            <div>
              {pagedRows.map((row, rowIndex) => (
                <div
                  key={row.id}
                  className={`grid grid-cols-[1.3fr_1.6fr_1fr_0.7fr] gap-3 px-4 py-2 text-sm border-b border-gray-100 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-brand-cream'}`}
                >
                  <div className="text-gray-900 truncate">{row.studentName}</div>
                  <div className="text-gray-700 truncate">{row.reason}</div>
                  <div className="text-gray-700">{formatPointLogDateDDMMYYYY(row.createdAt)}</div>
                  <div
                    className={`text-right font-semibold ${row.points >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {row.points > 0 ? `+${row.points}` : row.points}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-200 flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => setLogPage((p) => Math.max(1, p - 1))}
            disabled={safeLogPage <= 1}
            className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40"
          >
            &larr;
          </button>
          <span className="text-gray-700">
            Page {safeLogPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setLogPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeLogPage >= totalPages}
            className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40"
          >
            &rarr;
          </button>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setLogPage(1);
            }}
            className="ml-auto border border-gray-300 rounded px-2 py-1"
          >
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
        </div>
      </div>
    </div>
  );
}

