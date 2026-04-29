import { useState } from "react";

type Props = {
  floor: number;
  selected?: { x: number; y: number } | null;
  markers?: Array<{ id: string; x: number; y: number; type: "found" | "lost"; title: string }>;
  onClick?: (x: number, y: number) => void;
  onMarkerClick?: (id: string) => void;
  className?: string;
};

// Stylized SVG floor plan; coordinates are normalized 0..1
const ROOMS_BY_FLOOR: Record<number, Array<{ x: number; y: number; w: number; h: number; label: string }>> = {
  1: [
    { x: 0.05, y: 0.10, w: 0.20, h: 0.25, label: "현관" },
    { x: 0.27, y: 0.10, w: 0.22, h: 0.25, label: "행정실" },
    { x: 0.51, y: 0.10, w: 0.22, h: 0.25, label: "교무실" },
    { x: 0.75, y: 0.10, w: 0.20, h: 0.25, label: "보건실" },
    { x: 0.05, y: 0.40, w: 0.90, h: 0.10, label: "복도" },
    { x: 0.05, y: 0.55, w: 0.30, h: 0.35, label: "급식실" },
    { x: 0.37, y: 0.55, w: 0.26, h: 0.35, label: "체육관" },
    { x: 0.65, y: 0.55, w: 0.30, h: 0.35, label: "휴게실" },
  ],
  2: [
    { x: 0.05, y: 0.10, w: 0.18, h: 0.25, label: "2-1" },
    { x: 0.25, y: 0.10, w: 0.18, h: 0.25, label: "2-2" },
    { x: 0.45, y: 0.10, w: 0.18, h: 0.25, label: "2-3" },
    { x: 0.65, y: 0.10, w: 0.18, h: 0.25, label: "2-4" },
    { x: 0.85, y: 0.10, w: 0.10, h: 0.25, label: "WC" },
    { x: 0.05, y: 0.40, w: 0.90, h: 0.10, label: "복도" },
    { x: 0.05, y: 0.55, w: 0.30, h: 0.35, label: "도서관" },
    { x: 0.37, y: 0.55, w: 0.26, h: 0.35, label: "음악실" },
    { x: 0.65, y: 0.55, w: 0.30, h: 0.35, label: "미술실" },
  ],
  3: [
    { x: 0.05, y: 0.10, w: 0.18, h: 0.25, label: "3-1" },
    { x: 0.25, y: 0.10, w: 0.18, h: 0.25, label: "3-2" },
    { x: 0.45, y: 0.10, w: 0.18, h: 0.25, label: "3-3" },
    { x: 0.65, y: 0.10, w: 0.18, h: 0.25, label: "3-4" },
    { x: 0.85, y: 0.10, w: 0.10, h: 0.25, label: "WC" },
    { x: 0.05, y: 0.40, w: 0.90, h: 0.10, label: "복도" },
    { x: 0.05, y: 0.55, w: 0.30, h: 0.35, label: "물리실" },
    { x: 0.37, y: 0.55, w: 0.26, h: 0.35, label: "화학실" },
    { x: 0.65, y: 0.55, w: 0.30, h: 0.35, label: "생물실" },
  ],
  4: [
    { x: 0.05, y: 0.10, w: 0.20, h: 0.30, label: "기숙사 A" },
    { x: 0.27, y: 0.10, w: 0.20, h: 0.30, label: "기숙사 B" },
    { x: 0.49, y: 0.10, w: 0.20, h: 0.30, label: "기숙사 C" },
    { x: 0.71, y: 0.10, w: 0.24, h: 0.30, label: "공용 라운지" },
    { x: 0.05, y: 0.45, w: 0.90, h: 0.08, label: "복도" },
    { x: 0.20, y: 0.58, w: 0.60, h: 0.32, label: "옥상 정원" },
  ],
};

export const FloorMap = ({ floor, selected, markers = [], onClick, onMarkerClick, className }: Props) => {
  const rooms = ROOMS_BY_FLOOR[floor] ?? ROOMS_BY_FLOOR[1];
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onClick) return;
    const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    onClick(Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y)));
  };

  return (
    <div className={`relative rounded-2xl border border-border bg-card overflow-hidden ${className ?? ""}`}>
      <svg viewBox="0 0 100 70" className="w-full h-auto cursor-crosshair"
        onClick={handleClick}
        onMouseMove={(e) => {
          const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
          setHover({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="hsl(var(--border))" strokeWidth="0.1" opacity="0.5" />
          </pattern>
          <linearGradient id="roomGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary-glow))" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <rect width="100" height="70" fill="url(#grid)" />

        {/* Building outline */}
        <rect x="3" y="6" width="94" height="61" rx="2"
          fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="0.4" />

        {/* Rooms */}
        {rooms.map((r, i) => (
          <g key={i}>
            <rect x={r.x * 100} y={r.y * 70} width={r.w * 100} height={r.h * 70}
              rx="0.8" fill="url(#roomGrad)" stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.2" />
            <text x={(r.x + r.w / 2) * 100} y={(r.y + r.h / 2) * 70 + 0.8}
              textAnchor="middle" fontSize="2" fill="hsl(var(--primary))" fontWeight="600"
              style={{ pointerEvents: "none" }}>
              {r.label}
            </text>
          </g>
        ))}

        {/* Hover crosshair */}
        {hover && onClick && (
          <g style={{ pointerEvents: "none" }} opacity="0.4">
            <line x1={hover.x * 100} y1="0" x2={hover.x * 100} y2="70" stroke="hsl(var(--primary))" strokeWidth="0.15" strokeDasharray="0.5 0.5" />
            <line x1="0" y1={hover.y * 70} x2="100" y2={hover.y * 70} stroke="hsl(var(--primary))" strokeWidth="0.15" strokeDasharray="0.5 0.5" />
          </g>
        )}

        {/* Markers */}
        {markers.map((m) => (
          <g key={m.id} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); onMarkerClick?.(m.id); }}>
            <circle cx={m.x * 100} cy={m.y * 70} r="2.2"
              fill={m.type === "found" ? "hsl(var(--success))" : "hsl(var(--warning))"}
              opacity="0.25" />
            <circle cx={m.x * 100} cy={m.y * 70} r="1.2"
              fill={m.type === "found" ? "hsl(var(--success))" : "hsl(var(--warning))"}
              stroke="white" strokeWidth="0.3">
              <animate attributeName="r" values="1.2;1.6;1.2" dur="2s" repeatCount="indefinite" />
            </circle>
            <title>{m.title}</title>
          </g>
        ))}

        {/* Selected pin */}
        {selected && (
          <g style={{ pointerEvents: "none" }}>
            <circle cx={selected.x * 100} cy={selected.y * 70} r="3" fill="hsl(var(--primary))" opacity="0.2" />
            <circle cx={selected.x * 100} cy={selected.y * 70} r="1.5" fill="hsl(var(--primary))"
              stroke="white" strokeWidth="0.4" />
          </g>
        )}
      </svg>
    </div>
  );
};
