import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, MapPin, Plus, Filter, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

type Post = {
  id: string; type: "found" | "lost"; title: string; description: string | null;
  image_url: string | null; tags: string[]; floor: number | null;
  location_label: string | null; status: "open" | "resolved";
  created_at: string; author_id: string;
};

const typeLabel = { found: "주웠어요", lost: "잃어버렸어요" } as const;
const typeStyle = { found: "bg-success text-success-foreground", lost: "bg-warning text-warning-foreground" } as const;

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
      else setPosts((data ?? []) as any);
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
      <section className="border-b border-border/60 bg-gradient-to-b from-muted/40 to-transparent">
        <div className="container py-5 md:py-8 px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-4">
            <div>
              <h1 className="font-display text-2xl md:text-4xl font-bold">분실물 피드</h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">최신 등록순 // 총 {posts.length}건</p>
            </div>
            <Button asChild className="gradient-hero text-primary-foreground border-0 shadow-soft w-full md:w-auto h-10 justify-center text-sm">
              <Link to="/new"><Plus className="h-4 w-4 mr-1" />새 게시물</Link>
            </Button>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="제목, 태그, 위치 검색..."
                className="pl-9 h-10 bg-card text-sm" />
            </div>
            
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x mask-linear"
                 style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              <style>{`.scrollbar-none::-webkit-scrollbar { display: none; }`}</style>
              {(["all", "found", "lost", "open"] as const).map((f) => (
                <Button key={f} variant={filter === f ? "default" : "outline"}
                  size="sm" onClick={() => setFilter(f)}
                  className={`text-xs h-8 px-3.5 whitespace-nowrap snap-start shrink-0 rounded-lg ${filter === f ? "gradient-hero text-primary-foreground border-0" : ""}`}>
                  <Filter className="h-3 w-3 mr-1 shrink-0" />
                  {f === "all" ? "전체" : f === "found" ? "주웠어요" : f === "lost" ? "잃어버렸어요" : "미해결"}
                </Button>
              ))}
            </div>
          </div>

          {/*스크롤바 미없앱*/}
          {trendingTags.length > 0 && (
            <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none whitespace-nowrap"
                 style={{ scrollbarWidth: 'none' }}>
              <span className="text-[11px] font-medium text-muted-foreground shrink-0 mr-1">추천 태그</span>
              {trendingTags.map((t) => (
                <button key={t} onClick={() => setQ(t)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors shrink-0">
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container py-5 px-4 md:px-8">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="font-display text-base font-bold">검색 결과가 없어요</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">다른 검색어를 입력해 보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.2) }}>
                <Link to={`/post/${p.id}`}>
                  <Card className="overflow-hidden hover:shadow-soft transition-all duration-300 group h-full flex flex-col rounded-xl">
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-muted-foreground"><ImageOff className="h-6 w-6 opacity-40" /></div>
                      )}
                      <div className="absolute top-1.5 left-1.5 flex gap-1">
                        <Badge className={`${typeStyle[p.type]} border-0 font-bold text-[9px] px-1.5 py-0`}>{typeLabel[p.type]}</Badge>
                      </div>
                    </div>
                    <div className="p-2.5 flex-1 flex flex-col justify-between gap-1.5">
                      <div>
                        <h3 className="font-display font-semibold leading-tight line-clamp-1 text-xs md:text-sm text-foreground">{p.title}</h3>
                        {p.description && <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.description}</p>}
                      </div>
                      <div className="flex items-center justify-between text-[9px] md:text-xs text-muted-foreground border-t border-border/40 pt-1.5 min-w-0">
                        <div className="flex items-center gap-0.5 min-w-0 flex-1"><MapPin className="h-2.5 w-2.5 text-primary shrink-0" /><span className="truncate">{p.floor ? `${p.floor}F ` : ""}{p.location_label ?? "미지정"}</span></div>
                        <span className="shrink-0 ml-1 opacity-80">{formatDistanceToNow(new Date(p.created_at), { locale: ko })} 전</span>
                      </div>
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