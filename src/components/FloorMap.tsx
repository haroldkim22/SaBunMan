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

  const toNorm = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    const svgEl = (e.target as SVGElement).closest("svg")!;
    const rect = svgEl.getBoundingClientRect();
    
    // 터치 이벤트와 마우스 이벤트 모두 대응하도록 클라이언트 좌표 계산
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onClick) return;
    // 마커 자체를 클릭했을 때는 맵 클릭 이벤트가 실행되지 않도록 방어
    if ((e.target as SVGElement).classList.contains('touch-target')) return;
    const { x, y } = toNorm(e);
    onClick(x, y);
  };

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
        onMouseMove={(e) => !('touches' in e) && setHover(toNorm(e))}
        onMouseLeave={() => setHover(null)}
      >
        <image
          href={floorSrc(floor)}
          width={VB_W}
          height={VB_H}
          className="select-none pointer-events-none"
        />

        {hover && onClick && (
          <g style={{ pointerEvents: "none" }} opacity="0.5" className="hidden md:block">
            <line x1={hover.x * VB_W} y1="0" x2={hover.x * VB_W} y2={VB_H}
              stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1={hover.y * VB_H} x2={VB_W} y2={hover.y * VB_H}
              stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" />
          </g>
        )}

        {markers.map((m) => (
          <g 
            key={m.id} 
            style={{ cursor: "pointer" }}
            transform={`translate(${m.x * VB_W}, ${m.y * VB_H}) scale(${1 / scale})`}
            onClick={(e) => { e.stopPropagation(); onMarkerClick?.(m.id); }}
          >
            {/* 💡 최적화 포인트 3: 투명 터치 패딩 (핵심) */}
            {/* 눈에는 안 보이지만 지름 70px 크기의 거대한 클릭 영역을 생성하여 모바일 오클릭을 완벽하게 해결합니다. */}
            <circle 
              cx="0" 
              cy="0" 
              r="35" 
              fill="transparent" 
              className="touch-target"
              style={{ pointerEvents: "all" }} 
            />

            {/* 시각적 마커 요소들 */}
            <circle cx="0" cy="0" r="22"
              fill={m.type === "found" ? "hsl(var(--success))" : "hsl(var(--warning))"}
              opacity="0.25" style={{ pointerEvents: "none" }} />
            <circle cx="0" cy="0" r="11"
              fill={m.type === "found" ? "hsl(var(--success))" : "hsl(var(--warning))"}
              stroke="white" strokeWidth="3" style={{ pointerEvents: "none" }}>
              <animate attributeName="r" values="11;15;11" dur="1.5" repeatCount="indefinite" />
            </circle>
            <title>{m.title}</title>
          </g>
        ))}

        {selected && (
          <g 
            style={{ pointerEvents: "none" }}
            transform={`translate(${selected.x * VB_W}, ${selected.y * VB_H}) scale(${1 / scale})`}
          >
            <circle cx="0" cy="0" r="28" fill="hsl(var(--primary))" opacity="0.2" />
            <circle cx="0" cy="0" r="14" fill="hsl(var(--primary))" stroke="white" strokeWidth="4" />
          </g>
        )}
      </svg>
    </div>
  );

  if (!zoomable) {
    return (
      <div
        className={`relative rounded-2xl border border-border bg-card overflow-hidden flex items-center justify-center ${className ?? ""}`}
        style={{ width: "100%", height: "100%" }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-2xl border border-border bg-card overflow-hidden ${className ?? ""}`}
      style={{ width: "100%", height: "100%" }}
    >
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={6}
        wheel={{ step: 0.01, smooth: true }}
        doubleClick={{ disabled: true }}
        // 💡 최적화 포인트 4: 모바일 제스처 최적화
        // 모바일에서 두 손가락 핀치 줌이 부드럽게 먹히도록 설정하되, 한 손가락 페이지 스크롤 시 맵 안에서 걸리지 않도록 밸런스 유지
        panning={{ disabled: false, velocityDisabled: true, rows: 1 }}
        onTransformed={(instance: any) => setScale(instance.state.scale)}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperClass="!w-full !h-full"
              contentClass="!w-full !h-full flex items-center justify-center"
            >
              {content}
            </TransformComponent>
            
            {/* 우측 하단 컨트롤러: 모바일 터치를 위해 크기 및 여백 소폭 조정 */}
            <div className="absolute bottom-3 right-3 flex flex-col gap-2 z-10">
              <Button type="button" size="icon" variant="secondary"
                className="h-10 w-10 md:h-9 md:w-9 shadow-soft bg-background/95 backdrop-blur border border-border"
                onClick={(e) => { e.stopPropagation(); zoomIn(); }}>
                <ZoomIn className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
              <Button type="button" size="icon" variant="secondary"
                className="h-10 w-10 md:h-9 md:w-9 shadow-soft bg-background/95 backdrop-blur border border-border"
                onClick={(e) => { e.stopPropagation(); zoomOut(); }}>
                <ZoomOut className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
              <Button type="button" size="icon" variant="secondary"
                className="h-10 w-10 md:h-9 md:w-9 shadow-soft bg-background/95 backdrop-blur border border-border"
                onClick={(e) => { e.stopPropagation(); resetTransform(); }}>
                <Maximize2 className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};