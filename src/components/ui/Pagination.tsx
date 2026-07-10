interface PaginationProps {
  current: number;
  total: number;
  totalItems?: number;
  pageSize?: number;
  onChange: (page: number) => void;
}

function pageList(current: number, total: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) out.push(i);
    return out;
  }
  out.push(1);
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

export function Pagination({ current, total, totalItems, pageSize, onChange }: PaginationProps) {
  const go = (p: number) => {
    if (p >= 1 && p <= total && p !== current) onChange(p);
  };

  return (
    <nav aria-label="페이지 이동" className="flex items-center gap-1 flex-wrap">
      {totalItems != null && pageSize != null && (
        <span className="text-xs text-surface-500 mr-2">
          전체 {totalItems.toLocaleString()}건 중 {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, totalItems)}건
        </span>
      )}
      <button
        onClick={() => go(current - 1)}
        disabled={current <= 1}
        aria-label="이전"
        className="px-3 py-2 text-sm border border-surface-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-50 min-h-[44px]"
      >
        이전
      </button>
      {pageList(current, total).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="min-w-[24px] text-center text-surface-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => go(p)}
            aria-current={p === current ? "page" : undefined}
            className={`px-3 py-2 text-sm rounded-md border font-mono tabular-nums min-h-[44px] ${
              p === current
                ? "bg-primary-700 text-white border-primary-700 font-semibold"
                : "border-surface-300 hover:bg-surface-50"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => go(current + 1)}
        disabled={current >= total}
        aria-label="다음"
        className="px-3 py-2 text-sm border border-surface-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-50 min-h-[44px]"
      >
        다음
      </button>
    </nav>
  );
}
