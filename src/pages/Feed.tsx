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
  profiles?: { display_name: string; avatar_url: string | null } | null;
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
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <section className="border-b border-border/60 bg-gradient-to-b from-muted/40 to-transparent">
        <div className="container py-6 md:py-8 px-4 md:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-4">
            <div>
              <h1 className="font-display text-2xl md:text-4xl font-bold">분실물 피드</h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">최신 등록순 // 총 {posts.length}건</p>
            </div>
            <Button asChild className="gradient-hero text-primary-foreground border-0 shadow-soft w-full md:w-auto h-10 md:h-11 justify-center text-sm">
              <Link to="/new"><Plus className="h-4 w-4 mr-1" />새 게시물</Link>
            </Button>
          </div>

          <div className="mt-4 md:mt-6 flex flex-col md:flex-row gap-2.5 md:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="제목, 설명, 해시태그, 위치 검색..."
                className="pl-9 h-10 md:h-11 bg-card text-sm" />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar snap-x touch-pan-x">
              {(["all", "found", "lost", "open"] as const).map((f) => (
                <Button key={f} variant={filter === f ? "default" : "outline"}
                  size="sm" onClick={() => setFilter(f)}
                  className={`text-xs md:text-sm h-8 md:h-9 px-3.5 whitespace-nowrap snap-start shrink-0 ${filter === f ? "gradient-hero text-primary-foreground border-0" : ""}`}>
                  <Filter className="h-3 w-3 mr-1 shrink-0" />
                  {f === "all" ? "전체" : f === "found" ? "주웠어요" : f === "lost" ? "잃어버렸어요" : "미해결"}
                </Button>
              ))}
            </div>
          </div>

          {trendingTags.length > 0 && (
            <div className="mt-3.5 flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar whitespace-nowrap touch-pan-x">
              <span className="text-[11px] md:text-xs font-medium text-muted-foreground shrink-0 mr-1">태그</span>
              {trendingTags.map((t) => (
                <button key={t} onClick={() => setQ(t)}
                  className="text-[11px] md:text-xs px-2.5 py-0.5 md:py-1 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors shrink-0">
                  #{t}
                </button>
              ))}
            </div>
          )}

        </div>
      </section>

      <section className="container py-6 md:py-8 px-4 md:px-8">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl md:text-5xl mb-3">🔍</div>
            <h3 className="font-display text-lg md:text-xl font-bold">아직 게시물이 없어요</h3>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 mb-6">검색 조건을 바꿔보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filtered.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                <Link to={`/post/${p.id}`}>
                  <Card className="overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300 group h-full flex flex-col rounded-xl md:rounded-2xl">
                    
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} loading="lazy"
                          className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-500" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-muted-foreground">
                          <ImageOff className="h-7 w-7 md:h-10 md:w-10" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 md:top-3 md:left-3 flex gap-1">
                        <Badge className={`${typeStyle[p.type]} border-0 font-bold text-[9px] md:text-xs px-1.5 py-0 md:px-2.5 md:py-0.5`}>
                          {typeLabel[p.type]}
                        </Badge>
                        {p.status === "resolved" && (
                          <Badge variant="secondary" className="bg-background/80 backdrop-blur text-[9px] md:text-xs px-1.5 py-0">해결완료</Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 md:p-4 flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <h3 className="font-display font-semibold leading-tight line-clamp-1 text-sm md:text-lg text-foreground">
                          {p.title}
                        </h3>
                        {p.description && (
                          <p className="text-[11px] md:text-sm text-muted-foreground mt-0.5 md:mt-1 line-clamp-1 md:line-clamp-2">
                            {p.description}
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[10px] md:text-xs text-muted-foreground border-t border-border/40 pt-2 min-w-0">
                          <div className="flex items-center gap-0.5 md:gap-1 min-w-0 flex-1">
                            <MapPin className="h-2.5 w-2.5 md:h-3 md:w-3 shrink-0 text-primary" />
                            <span className="truncate">{p.floor ? `${p.floor}F` : ""} {p.location_label ?? "미지정"}</span>
                          </div>
                          <span className="shrink-0 ml-1 opacity-80">
                            {formatDistanceToNow(new Date(p.created_at), { locale: ko })} 전
                          </span>
                        </div>

                        {p.tags.length > 0 && (
                          <div className="mt-1.5 md:mt-3 flex gap-0.5 md:gap-1 flex-wrap">
                            {p.tags.slice(0, 2).map((t) => (
                              <span key={t} className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded bg-muted truncate max-w-[70px] md:max-w-[100px] text-muted-foreground">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
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