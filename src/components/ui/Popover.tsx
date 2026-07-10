import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type Placement = "bottom-start" | "bottom-end" | "top-start" | "right-start" | "right-end" | "left-start";

const PLACEMENT_CLASS: Record<Placement, string> = {
  "bottom-start": "top-full left-0 mt-1.5",
  "bottom-end": "top-full right-0 mt-1.5",
  "top-start": "bottom-full left-0 mb-1.5",
  "right-start": "top-0 left-full ml-1.5",
  "right-end": "bottom-0 left-full ml-1.5",
  "left-start": "top-0 right-full mr-1.5",
};

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode | ((ctx: { close: () => void }) => ReactNode);
  placement?: Placement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/** 트리거 기준 앵커드 팝업. 외부 클릭·Esc 닫기. 제어형(open)·비제어형 모두 지원. */
export function Popover({ trigger, children, placement = "bottom-start", open: controlledOpen, onOpenChange, className = "" }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const ref = useRef<HTMLDivElement>(null);

  const setOpen = (v: boolean) => (onOpenChange ? onOpenChange(v) : setInternalOpen(v));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="relative inline-flex" ref={ref}>
      <span onClick={() => setOpen(!open)}>{trigger}</span>
      {open && (
        <div
          className={`absolute z-[70] min-w-[180px] bg-white border border-surface-200 rounded-lg shadow-gh-md text-sm text-surface-700 ${PLACEMENT_CLASS[placement]} ${className}`}
        >
          {typeof children === "function" ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}
