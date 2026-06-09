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
      <div className="container mx-auto py-12 px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-[36px] font-bold leading-[1.25] text-black">학교 지도</h1>
            <p className="text-[16px] text-[#757575] mt-2">미해결 분실물 위치를 한눈에 · 마커를 클릭하세요</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {(["all", "found", "lost"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"}
                className={`h-10 px-4 rounded-sm font-bold text-[14.4px] ${filter === f ? "bg-black text-white border-black" : "bg-white text-black border-[#cccccc] hover:bg-[#f7f7f7]"}`}
                onClick={() => setFilter(f)}>
                {f === "all" ? "전체" : f === "found" ? "주웠어요" : "잃어버렸어요"}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-8 items-start">
          <div className="space-y-3">
            <div className="text-[12px] font-bold text-[#5e5e5e] tracking-wider mb-4 border-b border-[#cccccc] pb-2 uppercase">
              Select Floor
            </div>
            {[5, 4, 3, 2, 1].map((f) => (
              <button key={f} onClick={() => setFloor(f)}
                className={`w-full text-left p-5 rounded-sm border transition-all ${
                  floor === f ? "border-[#76b900] bg-black text-white" : "border-[#cccccc] bg-white hover:border-black"
                }`}>
                <div className="text-[24px] font-bold leading-[1.25]">{f}F</div>
                <div className={`text-[12px] mt-1 font-bold ${floor === f ? "text-[#76b900]" : "text-[#757575]"}`}>
                  {markers.filter((m) => m.floor === f).length}건의 분실물
                </div>
              </button>
            ))}
          </div>

          <div className="border border-[#cccccc] rounded-sm p-6 bg-white relative">
            <div className="absolute top-0 right-0 w-3 h-3 bg-[#76b900] z-10" />
            <FloorMap floor={floor} markers={visible} onMarkerClick={(id) => nav(`/post/${id}`)} />
            
            <div className="mt-8 pt-6 border-t border-[#cccccc] flex gap-6 text-[14px] font-bold text-black">
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-none bg-[#76b900]" />주웠어요</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-none bg-black" />잃어버렸어요</div>
              <div className="ml-auto bg-[#f7f7f7] border border-[#cccccc] px-3 py-1 rounded-sm text-[12px] text-[#5e5e5e]">
                {visible.length}개 표시중
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Map;
