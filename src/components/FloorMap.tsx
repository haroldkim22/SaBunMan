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

// 세종과학예술영재학교 배치도 SVG (public/floors)
// 원본 viewBox: 1190.67 x 841.89
const VB_W = 1190.67;
const VB_H = 841.89;

const floorSrc = (floor: number) => `/floors/floor-${Math.min(5, Math.max(1, floor))}.svg`;

export const FloorMap = ({
  floor, selected, markers = [], onClick, onMarkerClick, className, zoomable = true,
}: Props) => {
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

  // 핵심 수정 1: 지도가 깨지지 않고 반응형으로 크기가 조절되는 컨테이너 스타일링
  const content = (
    <div
      style={{
        width: "100%",
        height: "auto",
        maxHeight: "100%",
        aspectRatio: `${VB_W} / ${VB_H}`,
      }}
      className="relative"
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className={`w-full h-full ${onClick ? "cursor-crosshair" : ""}`}
        onClick={handleClick}
        onMouseMove={(e) => setHover(toNorm(e))}
        onMouseLeave={() => setHover(null)}
      >
        {/* 핵심 수정 2: 배경 이미지를 SVG 내부 요소로 삽입하여 마커와 완벽 동기화 */}
        <image
          href={floorSrc(floor)}
          width={VB_W}
          height={VB_H}
          className="select-none pointer-events-none"
        />

        {/* 인터랙션 오버레이 가이드라인 */}
        {hover && onClick && (
          <g style={{ pointerEvents: "none" }} opacity="0.5">
            <line x1={hover.x * VB_W} y1="0" x2={hover.x * VB_W} y2={VB_H}
              stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="6 6" />
            <line x1="0" y1={hover.y * VB_H} x2={VB_W} y2={hover.y * VB_H}
              stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="6 6" />
          </g>
        )}

        {/* 마커 렌더링 */}
        {markers.map((m) => (
          <g key={m.id} style={{ cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); onMarkerClick?.(m.id); }}>
            <circle cx={m.x * VB_W} cy={m.y * VB_H} r="22"
              fill={m.type === "found" ? "hsl(var(--success))" : "hsl(var(--warning))"}
              opacity="0.25" />
            <circle cx={m.x * VB_W} cy={m.y * VB_H} r="11"
              fill={m.type === "found" ? "hsl(var(--success))" : "hsl(var(--warning))"}
              stroke="white" strokeWidth="3">
              <animate attributeName="r" values="11;15;11" dur="1.5" repeatCount="indefinite" />
            </circle>
            <title>{m.title}</title>
          </g>
        ))}

        {/* 선택된 위치 핀 */}
        {selected && (
          <g style={{ pointerEvents: "none" }}>
            <circle cx={selected.x * VB_W} cy={selected.y * VB_H} r="28"
              fill="hsl(var(--primary))" opacity="0.2" />
            <circle cx={selected.x * VB_W} cy={selected.y * VB_H} r="14"
              fill="hsl(var(--primary))" stroke="white" strokeWidth="4" />
          </g>
        )}
      </svg>
    </div>
  );

  if (!zoomable) {
    return (
      <div
        className={`relative rounded-2xl border border-border bg-card overflow-hidden flex items-center justify-center ${className ?? ""}`}
        style={{ width: "100%", height: "55vh" }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-2xl border border-border bg-card overflow-hidden ${className ?? ""}`}
      style={{ width: "100%", height: "55vh" }}
    >
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={7}
        wheel={{ step: 0.05, smooth: true }}
        doubleClick={{ disabled: true }}
        panning={{ disabled: false, velocityDisabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* 핵심 수정 3: contentClass에 flex와 중앙 정렬을 주어 지도가 화면 한가운데 예쁘게 배치되도록 함 */}
            <TransformComponent
              wrapperClass="!w-full !h-full"
              contentClass="!w-full !h-full flex items-center justify-center"
            >
              {content}
            </TransformComponent>

            {/* 컨트롤 버튼 디자인 */}
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