import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  width?: number;
  children: ReactNode;
}

function useDismiss(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    const focusable = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
        ) ?? []
      );
    focusable()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const f = focusable();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return ref;
}

export function Dialog({ open, title, onClose, footer, width = 440, children }: DialogProps) {
  const ref = useDismiss(open, onClose);
  const titleId = "gh-dialog-title";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative bg-white rounded-2xl shadow-gh-lg max-h-[84vh] flex flex-col mx-4"
        style={{ width }}
      >
        <div className="flex items-center justify-between px-6 pt-[18px]">
          <h2 id={titleId} className="text-xl font-semibold text-surface-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-1 rounded-md text-surface-400 hover:bg-surface-100 hover:text-surface-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4 overflow-auto text-sm text-surface-700">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 pb-5">{footer}</div>}
      </div>
    </div>
  );
}
