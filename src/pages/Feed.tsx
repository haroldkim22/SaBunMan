import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, MapPin, Hash, Plus, Filter, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

type Post = {
  id: string; type: "found" | "lost"; title: string; description: string | null;
  image_url: string | null; tags: string[]; floor: number | null;
  location_label: string | null; status: "open" | "resolved";
  created_at: string; author_id: string;
  profiles?: { display_name: string; avatar_url: string | null } | null;
};

const typeLabel = { found: "주웠어요", lost: "잃어버렸어요" } as const;
const typeStyle = { found: "bg-[#76b900] text-black", lost: "bg-[#000000] text-white" } as const;

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "found" | "lost" | "open">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) toast.error("불러오기 실패");
      else {
        const ids = Array.from(new Set((data ?? []).map((p: any) => p.author_id)));
        const profileMap: Record<string, any> = {};
        if (ids.length) {
          const { data: profs } = await supabase
            .from("profiles").select("id, display_name, avatar_url").in("id", ids);
          (profs ?? []).forEach((pr: any) => { profileMap[pr.id] = pr; });
        }
        setPosts(((data ?? []) as any[]).map((p) => ({ ...p, profiles: profileMap[p.author_id] ?? null })) as any);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = posts.filter((p) => {
    if (filter === "open" && p.status !== "open") return false;
    if ((filter === "found" || filter === "lost") && p.type !== filter) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      return p.title.toLowerCase().includes(s) ||
        (p.description ?? "").toLowerCase().includes(s) ||
        p.tags.some((t) => t.toLowerCase().includes(s)) ||
        (p.location_label ?? "").toLowerCase().includes(s);
    }
    return true;
  });

  const trendingTags = Array.from(new Set(posts.flatMap((p) => p.tags))).slice(0, 8);

  return (
    <AppLayout>
      <section className="border-b border-[#cccccc] bg-[#f7f7f7]">
        <div className="container mx-auto py-12 px-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-[36px] font-bold text-black leading-[1.25]">분실물 피드</h1>
              <p className="text-[#757575] mt-2 text-[16px]">최신 등록순 / 총 {posts.length}건</p>
            </div>
            <Button asChild className="bg-[#76b900] text-black hover:bg-[#5a8d00] rounded-sm font-bold border-none px-6">
              <Link to="/new"><Plus className="h-4 w-4 mr-1" />새 게시물</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
              <Input value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="제목, 설명, 해시태그, 위치로 검색..."
                className="pl-11 h-12 bg-white border-[#cccccc] rounded-sm text-[16px] focus-visible:border-[#76b900] focus-visible:ring-0" />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {(["all", "found", "lost", "open"] as const).map((f) => (
                <Button key={f} variant={filter === f ? "default" : "outline"}
                  size="sm" onClick={() => setFilter(f)}
                  className={`h-12 px-6 rounded-sm font-bold text-[14.4px] ${filter === f ? "bg-black text-white border-black" : "bg-transparent text-black border-[#cccccc]"}`}>
                  <Filter className="h-4 w-4 mr-1" />
                  {f === "all" ? "전체" : f === "found" ? "주웠어요" : f === "lost" ? "잃어버렸어요" : "미해결"}
                </Button>
              ))}
            </div>
          </div>

          {trendingTags.length > 0 && (
            <div className="mt-6 flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-bold text-[#757575] uppercase tracking-wider">실시간 태그</span>
              {trendingTags.map((t) => (
                <button key={t} onClick={() => setQ(t)}
                  className="text-[12px] px-3 py-1 rounded-sm bg-white border border-[#cccccc] hover:border-[#76b900] transition-colors font-bold text-[#1a1a1a]">
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto py-12 px-12">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 rounded-sm bg-[#f7f7f7] border border-[#cccccc] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 border border-[#cccccc] bg-white rounded-sm">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-[20px] font-bold">아직 게시물이 없어요</h3>
            <p className="text-[#757575] mt-2 mb-8 text-[16px]">
              {posts.length === 0 ? "첫 분실물을 등록해보세요." : "검색 조건을 바꿔보세요."}
            </p>
            <Button asChild className="bg-black text-white hover:bg-[#1a1a1a] rounded-sm font-bold px-8 h-12">
               <Link to="/new">새 게시물 등록</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }} className="h-full">
                <Link to={`/post/${p.id}`} className="block h-full">
                  <Card className="h-full relative overflow-hidden rounded-sm border border-[#cccccc] bg-white hover:border-[#5e5e5e] transition-colors rounded-none shadow-none group">
                    <div className="absolute top-0 left-0 w-3 h-3 bg-[#76b900] z-10" />
                    <div className="aspect-[4/3] bg-[#f7f7f7] relative overflow-hidden border-b border-[#cccccc]">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} loading="lazy"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-[#cccccc]">
                          <ImageOff className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex gap-1.5">
                        <Badge className={`${typeStyle[p.type]} border border-[#cccccc] rounded-sm font-bold text-[12px] px-2 py-0.5`}>{typeLabel[p.type]}</Badge>
                        {p.status === "resolved" && (
                          <Badge variant="secondary" className="bg-white/90 text-black border border-[#cccccc] rounded-sm text-[12px] font-bold px-2 py-0.5">해결완료</Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-[17px] font-bold leading-[1.47] text-black line-clamp-1 mb-1">{p.title}</h3>
                      {p.description && (
                        <p className="text-[15px] text-[#757575] mt-2 line-clamp-2 leading-[1.67]">{p.description}</p>
                      )}
                      <div className="mt-4 pt-4 border-t border-[#cccccc] flex items-center justify-between text-[12px] text-[#757575] font-bold">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {p.floor ? `${p.floor}F` : ""} {p.location_label ?? "위치 미지정"}
                        </div>
                        <span>{formatDistanceToNow(new Date(p.created_at), { locale: ko, addSuffix: true })}</span>
                      </div>
                      {p.tags.length > 0 && (
                        <div className="mt-4 flex gap-1.5 flex-wrap">
                          {p.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[11px] font-bold px-2 py-0.5 rounded-sm bg-[#f7f7f7] border border-[#cccccc] text-[#1a1a1a]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
};

export default Feed;
