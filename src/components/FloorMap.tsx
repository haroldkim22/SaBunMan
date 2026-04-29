import { useState } from "react";

type Props = {
  floor: number;
  selected?: { x: number; y: number } | null;
  markers?: Array<{ id: string; x: number; y: number; type: "found" | "lost"; title: string }>;
  onClick?: (x: number, y: number) => void;
  onMarkerClick?: (id: string) => void;
  className?: string;
};

// 세종과학예술영재학교 배치도 SVG (public/floors)
// 원본 viewBox: 1190.67 x 841.89
const VB_W = 1190.67;
const VB_H = 841.89;

const floorSrc = (floor: number) => `/floors/floor-${Math.min(5, Math.max(1, floor))}.svg`;

export const FloorMap = ({ floor, selected, markers = [], onClick, onMarkerClick, className }: Props) => {
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

  const toNorm = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onClick) return;
    const { x, y } = toNorm(e);
    onClick(x, y);
  };

  return (
    <div className={`relative rounded-2xl border border-border bg-card overflow-hidden ${className ?? ""}`}>
      {/* 배경 배치도 이미지 */}
      <img
        src={floorSrc(floor)}
        alt={`${floor}층 배치도`}
        className="block w-full h-auto select-none pointer-events-none"
        draggable={false}
      />

      {/* 인터랙션 오버레이 */}
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className={`absolute inset-0 w-full h-full ${onClick ? "cursor-crosshair" : ""}`}
        onClick={handleClick}
        onMouseMove={(e) => setHover(toNorm(e))}
        onMouseLeave={() => setHover(null)}
        preserveAspectRatio="none"
      >
        {/* Hover crosshair */}
        {hover && onClick && (
          <g style={{ pointerEvents: "none" }} opacity="0.5">
            <line x1={hover.x * VB_W} y1="0" x2={hover.x * VB_W} y2={VB_H} stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="6 6" />
            <line x1="0" y1={hover.y * VB_H} x2={VB_W} y2={hover.y * VB_H} stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="6 6" />
          </g>
        )}

        {/* Markers */}
        {markers.map((m) => (
          <g key={m.id} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); onMarkerClick?.(m.id); }}>
            <circle cx={m.x * VB_W} cy={m.y * VB_H} r="22"
              fill={m.type === "found" ? "hsl(var(--success))" : "hsl(var(--warning))"}
              opacity="0.25" />
            <circle cx={m.x * VB_W} cy={m.y * VB_H} r="11"
              fill={m.type === "found" ? "hsl(var(--success))" : "hsl(var(--warning))"}
              stroke="white" strokeWidth="3">
              <animate attributeName="r" values="11;15;11" dur="2s" repeatCount="indefinite" />
            </circle>
            <title>{m.title}</title>
          </g>
        ))}

        {/* Selected pin */}
        {selected && (
          <g style={{ pointerEvents: "none" }}>
            <circle cx={selected.x * VB_W} cy={selected.y * VB_H} r="28" fill="hsl(var(--primary))" opacity="0.2" />
            <circle cx={selected.x * VB_W} cy={selected.y * VB_H} r="14" fill="hsl(var(--primary))"
              stroke="white" strokeWidth="4" />
          </g>
        )}
      </svg>
    </div>
  );
};
