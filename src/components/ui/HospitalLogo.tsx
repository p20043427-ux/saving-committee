interface HospitalLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  variant?: "full" | "symbol";
}

export function HospitalLogo({
  size = 40,
  showText = true,
  textColor = "white",
  variant = "full",
}: HospitalLogoProps) {
  const s = size;
  const b = Math.round(s * 0.28); // block size
  const gap = Math.round(s * 0.04);
  const r = Math.round(b * 0.22); // corner radius

  // cross: center + top + left + right + bottom
  const cx = s / 2 - b / 2;
  const cy = s / 2 - b / 2;

  const blocks = [
    { x: cx, y: cy - b - gap, color: "#1b3f8b", icon: "heart" },
    { x: cx - b - gap, y: cy, color: "#1b3f8b", icon: "flower" },
    { x: cx, y: cy, color: "#2aafa0", icon: "person" },
    { x: cx + b + gap, y: cy, color: "#1b3f8b", icon: "cloud" },
    { x: cx, y: cy + b + gap, color: "#1b3f8b", icon: "wave" },
  ];

  const iconScale = b / 32;

  function renderIcon(icon: string, x: number, y: number) {
    const cx2 = x + b / 2;
    const cy2 = y + b / 2;
    const sc = iconScale;
    switch (icon) {
      case "heart":
        return (
          <path
            key="heart"
            d={`M${cx2},${cy2 + 5 * sc} C${cx2 - 1 * sc},${cy2 + 3 * sc} ${cx2 - 7 * sc},${cy2 - 1 * sc} ${cx2 - 7 * sc},${cy2 - 4 * sc} C${cx2 - 7 * sc},${cy2 - 7 * sc} ${cx2 - 4 * sc},${cy2 - 9 * sc} ${cx2},${cy2 - 6 * sc} C${cx2 + 4 * sc},${cy2 - 9 * sc} ${cx2 + 7 * sc},${cy2 - 7 * sc} ${cx2 + 7 * sc},${cy2 - 4 * sc} C${cx2 + 7 * sc},${cy2 - 1 * sc} ${cx2 + 1 * sc},${cy2 + 3 * sc} ${cx2},${cy2 + 5 * sc} Z`}
            fill="white"
          />
        );
      case "flower":
        return (
          <g key="flower">
            {[0, 60, 120, 180, 240, 300].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const px = cx2 + Math.cos(rad) * 4.5 * sc;
              const py = cy2 + Math.sin(rad) * 4.5 * sc;
              return <circle key={i} cx={px} cy={py} r={3 * sc} fill="white" />;
            })}
            <circle cx={cx2} cy={cy2} r={3 * sc} fill="white" />
          </g>
        );
      case "person":
        return (
          <g key="person">
            <circle cx={cx2} cy={cy2 - 5 * sc} r={3.5 * sc} fill="white" />
            <path
              d={`M${cx2 - 6 * sc},${cy2 + 6 * sc} Q${cx2 - 6 * sc},${cy2 - 1 * sc} ${cx2},${cy2 - 1 * sc} Q${cx2 + 6 * sc},${cy2 - 1 * sc} ${cx2 + 6 * sc},${cy2 + 6 * sc} Z`}
              fill="white"
            />
          </g>
        );
      case "cloud":
        return (
          <g key="cloud">
            <ellipse cx={cx2 - 3 * sc} cy={cy2} rx={5 * sc} ry={3.5 * sc} fill="white" />
            <ellipse cx={cx2 + 3 * sc} cy={cy2 + 1 * sc} rx={4 * sc} ry={3 * sc} fill="white" />
            <rect x={cx2 - 8 * sc} y={cy2 + 1 * sc} width={16 * sc} height={3 * sc} fill="white" />
          </g>
        );
      case "wave":
        return (
          <g key="wave">
            {[-4, 0, 4].map((dy, i) => (
              <path
                key={i}
                d={`M${cx2 - 7 * sc},${cy2 + dy * sc} Q${cx2 - 3.5 * sc},${cy2 + (dy - 3) * sc} ${cx2},${cy2 + dy * sc} Q${cx2 + 3.5 * sc},${cy2 + (dy + 3) * sc} ${cx2 + 7 * sc},${cy2 + dy * sc}`}
                stroke="white"
                strokeWidth={1.5 * sc}
                fill="none"
                strokeLinecap="round"
              />
            ))}
          </g>
        );
      default:
        return null;
    }
  }

  const symbolHeight = b * 3 + gap * 2;
  const symbolWidth = b * 3 + gap * 2;

  if (variant === "symbol") {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="은성의료재단 좋은문화병원 심볼"
        role="img"
      >
        {blocks.map((bl) => (
          <rect
            key={bl.icon}
            x={bl.x}
            y={bl.y}
            width={b}
            height={b}
            rx={r}
            fill={bl.color}
          />
        ))}
        {blocks.map((bl) => renderIcon(bl.icon, bl.x, bl.y))}
      </svg>
    );
  }

  if (!showText) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="은성의료재단 좋은문화병원"
        role="img"
      >
        {blocks.map((bl) => (
          <rect key={bl.icon} x={bl.x} y={bl.y} width={b} height={b} rx={r} fill={bl.color} />
        ))}
        {blocks.map((bl) => renderIcon(bl.icon, bl.x, bl.y))}
      </svg>
    );
  }

  const textSize = Math.round(s * 0.22);
  const subSize = Math.round(s * 0.13);
  const totalW = symbolWidth + Math.round(s * 0.18) + Math.round(s * 1.1);

  return (
    <svg
      width={totalW}
      height={symbolHeight}
      viewBox={`0 0 ${totalW} ${symbolHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="은성의료재단 좋은문화병원"
      role="img"
    >
      {blocks.map((bl) => (
        <rect
          key={bl.icon}
          x={bl.x - (s / 2 - b / 2) + (s - symbolWidth) / 2}
          y={bl.y - (s / 2 - b / 2) + (s - symbolHeight) / 2}
          width={b}
          height={b}
          rx={r}
          fill={bl.color}
        />
      ))}
      {blocks.map((bl) =>
        renderIcon(
          bl.icon,
          bl.x - (s / 2 - b / 2) + (s - symbolWidth) / 2,
          bl.y - (s / 2 - b / 2) + (s - symbolHeight) / 2
        )
      )}
      <text
        x={symbolWidth + Math.round(s * 0.18)}
        y={symbolHeight / 2 - 2}
        fill={textColor}
        fontSize={textSize}
        fontWeight="700"
        fontFamily="'Pretendard', 'Noto Sans KR', sans-serif"
        dominantBaseline="auto"
      >
        좋은문화병원
      </text>
      <text
        x={symbolWidth + Math.round(s * 0.18)}
        y={symbolHeight / 2 + subSize + 2}
        fill={textColor}
        fontSize={subSize}
        fontWeight="400"
        fontFamily="'Pretendard', 'Noto Sans KR', sans-serif"
        opacity="0.65"
        dominantBaseline="auto"
      >
        은성의료재단
      </text>
    </svg>
  );
}
