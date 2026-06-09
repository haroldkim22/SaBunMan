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
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">학교 지도</h1>
            <p className="text-muted-foreground mt-1">미해결 분실물 위치를 한눈에 · 마커를 클릭하세요</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "found", "lost"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"}
                className={filter === f ? "gradient-hero text-primary-foreground border-0" : ""}
                onClick={() => setFilter(f)}>
                {f === "all" ? "전체" : f === "found" ? "주웠어요" : "잃어버렸어요"}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[200px_1fr] gap-6">
          <div className="space-y-2">
            <div className="text-xs font-bold text-muted-foreground tracking-wider mb-2">FLOOR</div>
            {[5, 4, 3, 2, 1].map((f) => (
              <button key={f} onClick={() => setFloor(f)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${floor === f ? "border-primary bg-primary text-primary-foreground shadow-soft" : "border-border bg-card hover:border-primary/50"
                  }`}>
                <div className="font-display text-2xl font-bold">{f}F</div>
                <div className={`text-xs mt-0.5 ${floor === f ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {markers.filter((m) => m.floor === f).length}건
                </div>
              </button>
            ))}
          </div>

          <div>
            <FloorMap floor={floor} markers={visible} onMarkerClick={(id) => nav(`/post/${id}`)} />
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
