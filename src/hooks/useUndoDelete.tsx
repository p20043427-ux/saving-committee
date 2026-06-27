import React from 'react';
import { toast } from '@/src/components/ui/Toast';

const UNDO_DELAY_MS = 5000;

/**
 * 삭제 실행을 5초 지연하고 그 사이에 되돌리기 기회를 준다.
 * 반환값: true = 실제 삭제됨, false = 취소됨
 */
export function useUndoDelete() {
  const deleteWithUndo = (
    label: string,
    onDeleteConfirmed: () => Promise<void>
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      let cancelled = false;

      const handleUndo = (toastId: string) => {
        cancelled = true;
        toast.dismiss(toastId);
        resolve(false);
      };

      const toastId = toast.custom(
        (t) => (
          <div
            className={`flex items-center gap-3 bg-surface-800 text-white px-4 py-3 rounded-xl shadow-lg transition-opacity ${t.visible ? 'opacity-100' : 'opacity-0'}`}
          >
            <span className="text-sm">{label} 삭제됨</span>
            <button
              onClick={() => handleUndo(t.id)}
              className="text-xs font-bold underline ml-2"
              style={{ color: '#5eead4' }}
            >
              되돌리기
            </button>
          </div>
        ),
        { duration: UNDO_DELAY_MS }
      );

      setTimeout(async () => {
        if (!cancelled) {
          toast.dismiss(toastId);
          try {
            await onDeleteConfirmed();
          } finally {
            resolve(true);
          }
        }
      }, UNDO_DELAY_MS);
    });
  };

  return { deleteWithUndo };
}
