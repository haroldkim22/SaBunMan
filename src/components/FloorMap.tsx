import { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

type Props = {
  floor: number;
  selected?: { x: number; y: number } | null;
  markers?: Array<{ id: string; x: number; y: number; type: "found" | "lost"; title: string }>;
  onClick?: (x: number, y: number) => void;
  onMarkerClick?: (id: string) => void;
  className?: string;
  zoomable?: boolean;
};

const VB_W = 1190.67;
const VB_H = 841.89;

const floorSrc = (floor: number) => `/floors/floor-${Math.min(5, Math.max(1, floor))}.svg`;

export const FloorMap = ({
  floor, selected, markers = [], onClick, onMarkerClick, className, zoomable = true,
}: Props) => {
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [scale, setScale] = useState(1);

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

  // 마커 반지름 – 줌 배율에 반비례해 화면상 크기가 일정하게 유지됨
  const MARKER_R = 11;
  const PULSE_R1 = 11;
  const PULSE_R2 = 15;
  const HALO_R = 22;
  const SEL_R = 14;
  const SEL_HALO_R = 28;

  // SVG viewBox 단위로 환산한 반지름 (화면 픽셀 → viewBox 단위)
  // TransformWrapper 내부 scale을 반영해 항상 동일한 화면 크기를 유지
  const mr = MARKER_R / scale;
  const pr1 = PULSE_R1 / scale;
  const pr2 = PULSE_R2 / scale;
  const hr = HALO_R / scale;
  const sr = SEL_R / scale;
  const shr = SEL_HALO_R / scale;
  const strokeW = 3 / scale;
  const selStrokeW = 4 / scale;

  const content = (
    // aspect-ratio로 비율을 유지하고, 부모 높이를 초과하지 않도록 max-height는 외부 컨테이너가 담당
    <div
      className="relative w-full"
      style={{ aspectRatio: `${VB_W} / ${VB_H}` }}
    >
      {/* 배경 배치도 이미지 */}
      <img
        src={floorSrc(floor)}
        alt={`${floor}층 배치도`}
        className="absolute inset-0 w-full h-full select-none pointer-events-none object-contain"
        draggable={false}
      />

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className={`absolute inset-0 w-full h-full ${onClick ? "cursor-crosshair" : ""}`}
        onClick={handleClick}
        onMouseMove={(e) => setHover(toNorm(e))}
        onMouseLeave={() => setHover(null)}
        preserveAspectRatio="xMidYMid meet"
      >
        {hover && onClick && (
          <g style={{ pointerEvents: "none" }} opacity="0.5">
            <line x1={hover.x * VB_W} y1="0" x2={hover.x * VB_W} y2={VB_H}
              stroke="hsl(var(--primary))" strokeWidth={1.5 / scale} strokeDasharray={`${6 / scale} ${6 / scale}`} vectorEffect="non-scaling-stroke" />
            <line x1="0" y1={hover.y * VB_H} x2={VB_W} y2={hover.y * VB_H}
              stroke="hsl(var(--primary))" strokeWidth={1.5 / scale} strokeDasharray={`${6 / scale} ${6 / scale}`} vectorEffect="non-scaling-stroke" />
          </g>
        )}

        {markers.map((m) => (
          <g
            key={m.id}
            style={{ cursor: "pointer" }}
            transform={`translate(${m.x * VB_W}, ${m.y * VB_H})`}
            onClick={(e) => { e.stopPropagation(); onMarkerClick?.(m.id); }}
          >
            <circle cx="0" cy="0" r={hr}
              fill={m.type === "found" ? "hsl(var(--success))" : "hsl(var(--warning))"}
              opacity="0.25" />
            <circle cx="0" cy="0" r={mr}
              fill={m.type === "found" ? "hsl(var(--success))" : "hsl(var(--warning))"}
              stroke="white" strokeWidth={strokeW}>
              <animate attributeName="r" values={`${pr1};${pr2};${pr1}`} dur="0.5" repeatCount="indefinite" />
            </circle>
            <title>{m.title}</title>
          </g>
        ))}

        {selected && (
          <g
            style={{ pointerEvents: "none" }}
            transform={`translate(${selected.x * VB_W}, ${selected.y * VB_H})`}
          >
            <circle cx="0" cy="0" r={shr}
              fill="hsl(var(--primary))" opacity="0.2" />
            <circle cx="0" cy="0" r={sr}
              fill="hsl(var(--primary))" stroke="white" strokeWidth={selStrokeW} />
          </g>
        )}
      </svg>
    </div>
  );

  // ── non-zoomable (피드 상세 등 작은 인라인 미리보기) ──────────────────
  if (!zoomable) {
    return (
      <div
        className={`relative rounded-2xl border border-border bg-card overflow-hidden ${className ?? ""}`}
        // 너비에 맞춰 비율을 유지 (aspect-ratio는 content 내부에서 담당)
        style={{ width: "100%" }}
      >
        {content}
      </div>
    );
  }

  // ── zoomable (지도 탭) ────────────────────────────────────────────────
  return (
    <div
      className={`relative rounded-2xl border border-border bg-card overflow-hidden ${className ?? ""}`}
      // 지도 탭: 세로를 뷰포트의 60% 이하로 제한하되 가로 100% 사용
      style={{ width: "100%", maxHeight: "62vh", aspectRatio: `${VB_W} / ${VB_H}` }}
    >
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={7}
        wheel={{ step: 0.01, smooth: true }}
        doubleClick={{ disabled: true }}
        panning={{ disabled: false, velocityDisabled: true }}
        animationDuration={30}
        onTransformed={(instance) => setScale(instance.state.scale)}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ width: "100%", height: "100%" }}
            >
              {content}
            </TransformComponent>
            <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10">
              <Button type="button" size="icon" variant="secondary"
                className="h-9 w-9 shadow-soft bg-background/95 backdrop-blur"
                onClick={(e) => { e.stopPropagation(); zoomIn(); }}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="secondary"
                className="h-9 w-9 shadow-soft bg-background/95 backdrop-blur"
                onClick={(e) => { e.stopPropagation(); zoomOut(); }}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="secondary"
                className="h-9 w-9 shadow-soft bg-background/95 backdrop-blur"
                onClick={(e) => { e.stopPropagation(); resetTransform(); }}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};