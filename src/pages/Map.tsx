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
      <div className="container py-8 px-4 md:px-8">
        {/* 상단 헤더 영역 */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">학교 지도</h1>
            <p className="text-muted-foreground mt-1">미해결 분실물 위치를 한눈에 · 마커를 클릭하세요</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 md:flex-wrap scrollbar-none">
            {(["all", "found", "lost"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"}
                className={`whitespace-nowrap ${filter === f ? "gradient-hero text-primary-foreground border-0" : ""}`}
                onClick={() => setFilter(f)}>
                {f === "all" ? "전체" : f === "found" ? "주웠어요" : "잃어버렸어요"}
              </Button>
            ))}
          </div>
        </div>

        {/* 메인 그리드 레이아웃: PC 비율인 [200px_1fr]과 gap-6 완벽 복구 */}
        <div className="grid lg:grid-cols-[200px_1fr] gap-6">
          
          {/* 층수 선택 버튼 영역 */}
          {/* PC에서는 원래대로 세로 배치(lg:flex-col), 모바일에서만 가로 스크롤바로 자동 전환 */}
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none snap-x">
            <div className="hidden lg:block text-xs font-bold text-muted-foreground tracking-wider mb-2">FLOOR</div>
            {[5, 4, 3, 2, 1].map((f) => (
              <button 
                key={f} 
                onClick={() => setFloor(f)}
                className={`flex-1 lg:flex-initial min-w-[80px] lg:w-full text-center lg:text-left p-3 lg:p-4 rounded-xl border transition-all snap-start ${
                  floor === f ? "border-primary bg-primary text-primary-foreground shadow-soft" : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="font-display text-xl lg:text-2xl font-bold">{f}F</div>
                <div className={`text-[10px] lg:text-xs mt-0.5 ${floor === f ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {markers.filter((m) => m.floor === f).length}건
                </div>
              </button>
            ))}
          </div>

          {/* 지도 컨테이너 영역 */}
          <div>
            {/* 💡 PC 스크린샷의 비율을 유지하기 위해 Tailwind의 반응형 임의값 클래스로 분리했습니다. */}
            {/* 기본(모바일): 적당한 높이(h-[45vh]) 유지하여 스크롤 갇힘 방지 */}
            {/* lg(PC): 기존 소스코드의 원래 비율인 h-[min(65vh,720px)] 및 max-h-[calc(100vh-240px)] 완벽 복원 */}
            <div
              className="relative w-full overflow-hidden rounded-3xl border border-border bg-card shadow-soft h-[45vh] min-h-[360px] lg:h-[min(65vh,720px)] lg:max-h-[calc(100vh-240px)]"
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
            
            {/* 하단 안내 라벨 */}
            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-success" />주웠어요</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-warning" />잃어버렸어요</div>
              <Badge variant="secondary" className="ml-auto">{visible.length}개 표시중</Badge>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

export default Map;