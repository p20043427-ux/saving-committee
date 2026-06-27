import React, { useEffect, useRef } from "react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen, title, message, confirmLabel = "확인", cancelLabel = "취소",
  variant = "danger", onConfirm, onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = "confirm-dialog-title";
  const descId = "confirm-dialog-desc";

  useEffect(() => {
    if (!isOpen) return;
    const firstBtn = dialogRef.current?.querySelector<HTMLButtonElement>("button");
    firstBtn?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onCancel(); return; }
      if (e.key === "Tab") {
        const focusable = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(
            "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
          ) ?? []
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="presentation">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4"
      >
        <h3 id={titleId} className="text-base font-bold text-surface-900 mb-2">{title}</h3>
        <p id={descId} className="text-sm text-surface-600 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="md" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={variant} size="md" onClick={onConfirm} autoFocus>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
