const SCALE_LABELS = ["아주못함", "못함", "보통", "잘함", "아주잘함"] as const;

interface ScorePickerProps {
  label: string;
  name: string;
  value: number;
  onChange: (score: number) => void;
}

/** 1~5점 선택 (아주못함 ~ 아주잘함). 점검표 입력과 기존 기록 수정에서 함께 쓴다. */
export function ScorePicker({ label, name, value, onChange }: ScorePickerProps) {
  return (
    <fieldset className="flex flex-col space-y-1.5">
      <legend className="text-sm font-medium text-surface-700 mb-1.5">{label}</legend>
      <div className="flex items-start space-x-1">
        {SCALE_LABELS.map((scale, i) => {
          const score = i + 1;
          const selected = value === score;
          return (
            <label key={score} className="flex flex-col items-center cursor-pointer group flex-1 py-1">
              <input
                type="radio"
                name={name}
                value={score}
                checked={selected}
                onChange={() => onChange(score)}
                className="sr-only peer"
              />
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-semibold transition-all outline outline-1 group-hover:bg-primary-50 peer-focus-visible:ring-[3px] peer-focus-visible:ring-primary-500/30 touch-manipulation
                  ${selected ? "bg-primary-600 text-white outline-primary-600 shadow-gh-sm" : "text-surface-700 outline-surface-300"}`}
              >
                {score}
              </div>
              <span className={`mt-1 text-[10px] leading-tight ${selected ? "text-primary-700 font-semibold" : "text-surface-400"}`}>
                {scale}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
