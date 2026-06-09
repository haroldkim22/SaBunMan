import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FloorMap } from "@/components/FloorMap";
import { Badge } from "@/components/ui/badge";

type Marker = { id: string; x: number; y: number; type: "found" | "lost"; title: string; floor: number };

const Map = () => {
  const [floor, setFloor] = useState(1);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [filter, setFilter] = useState<"all" | "found" | "lost">("all");
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("posts")
        .select("id, type, title, floor, location_x, location_y, status")
        .eq("status", "open")
        .not("floor", "is", null)
        .not("location_x", "is", null);
      setMarkers((data ?? []).map((p: any) => ({
        id: p.id, x: p.location_x, y: p.location_y, type: p.type, title: p.title, floor: p.floor,
      })));
    })();
  }, []);

  const visible = markers.filter((m) => m.floor === floor && (filter === "all" || m.type === filter));

  return (
    <AppLayout>
      <div className="container px-4 py-6 md:py-8">
        {/* 헤더 영역: 모바일 배려하여 여백 축소 */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-4xl font-bold">학교 지도</h1>
            <p className="text-sm text-muted-foreground mt-0.5">미해결 분실물 위치를 한눈에 · 마커를 클릭하세요</p>
          </div>
          {/* 필터 버튼: 모바일에서 꽉 차게 혹은 자연스럽게 흐르도록 설정 */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap">
            {(["all", "found", "lost"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"}
                className={`text-xs md:text-sm whitespace-nowrap ${filter === f ? "gradient-hero text-primary-foreground border-0" : ""}`}
                onClick={() => setFilter(f)}>
                {f === "all" ? "전체" : f === "found" ? "주웠어요" : "잃어버렸어요"}
              </Button>
            ))}
          </div>
        </div>

        {/* 메인 레이아웃: lg 미만 화면에서는 세로 배치 */}
        <div className="grid lg:grid-cols-[160px_1fr] gap-4 md:gap-6">
          
          {/* 💡 최적화 포인트 1: 층수 선택부 */}
          {/* 모바일에서는 가로로 넘기는 스크롤 바(flex-row) / 데스크톱에서는 세로 정렬(lg:flex-col) */}
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none snap-x">
            {[5, 4, 3, 2, 1].map((f) => (
              <button 
                key={f} 
                onClick={() => setFloor(f)}
                className={`flex-1 lg:flex-initial min-w-[75px] sm:min-w-[100px] lg:w-full text-center lg:text-left p-2.5 lg:p-4 rounded-xl border transition-all snap-start ${
                  floor === f 
                    ? "border-primary bg-primary text-primary-foreground shadow-soft" 
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="font-display text-lg lg:text-2xl font-bold">{f}F</div>
                <div className={`text-[10px] lg:text-xs mt-0.5 ${floor === f ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {markers.filter((m) => m.floor === f).length}건
                </div>
              </button>
            ))}
          </div>

          {/* 지도 컨테이너 */}
          <div>
            {/* 💡 최적화 포인트 2: 모바일/데스크톱 높이 이원화 */}
            {/* 모바일(기본)에서는 화면의 45% 정도만 차지하게 하여 하단 여백(스크롤 탈출용) 확보, 데스크톱에서 커짐 */}
            <div
              className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl border border-border bg-card shadow-soft"
              style={{ height: "calc(var(--vh, 1vh) * 45)", minHeight: "340px", maxHeight: "680px" }}
            >
              <div className="h-full w-full">
                <FloorMap
                  className="h-full w-full"
                  floor={floor}
                  markers={visible}
                  onMarkerClick={(id) => nav(`/post/${id}`)}
                />
              </div>
            </div>
            
            {/* 안내 배지 및 설명 */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success" />주웠어요</div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning" />잃어버렸어요</div>
              <Badge variant="secondary" className="ml-auto text-[11px] px-2 py-0.5">{visible.length}개 표시중</Badge>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

export default Map;