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

const typeLabel = { found: "찾음", lost: "찾는중" } as const;
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
      <section className="border-b border-border/60 bg-gradient-to-b from-muted/40 to-transparent">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold">분실물 피드</h1>
              <p className="text-muted-foreground mt-1">최신 등록순 · 총 {posts.length}건</p>
            </div>
            <Button asChild className="gradient-hero text-primary-foreground border-0 shadow-soft">
              <Link to="/new"><Plus className="h-4 w-4 mr-1" />새 게시물</Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="제목, 설명, 해시태그, 위치로 검색..."
                className="pl-9 h-11 bg-card" />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {(["all", "found", "lost", "open"] as const).map((f) => (
                <Button key={f} variant={filter === f ? "default" : "outline"}
                  size="sm" onClick={() => setFilter(f)}
                  className={filter === f ? "gradient-hero text-primary-foreground border-0" : ""}>
                  <Filter className="h-3 w-3 mr-1" />
                  {f === "all" ? "전체" : f === "found" ? "찾음" : f === "lost" ? "찾는중" : "미해결"}
                </Button>
              ))}
            </div>
          </div>

          {trendingTags.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">실시간 태그</span>
              {trendingTags.map((t) => (
                <button key={t} onClick={() => setQ(t)}
                  className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="container py-8">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="font-display text-xl font-bold">아직 게시물이 없어요</h3>
            <p className="text-muted-foreground mt-1 mb-6">
              {posts.length === 0 ? "첫 분실물을 등록해보세요." : "검색 조건을 바꿔보세요."}
            </p>
            <Button asChild><Link to="/new">새 게시물 등록</Link></Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}>
                <Link to={`/post/${p.id}`}>
                  <Card className="overflow-hidden hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 group h-full">
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} loading="lazy"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-muted-foreground">
                          <ImageOff className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <Badge className={`${typeStyle[p.type]} border-0 font-bold`}>{typeLabel[p.type]}</Badge>
                        {p.status === "resolved" && (
                          <Badge variant="secondary" className="bg-background/80 backdrop-blur">해결완료</Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-display font-semibold leading-tight line-clamp-1">{p.title}</h3>
                      {p.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                      )}
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {p.floor ? `${p.floor}F` : ""} {p.location_label ?? "위치 미지정"}
                        </div>
                        <span>{formatDistanceToNow(new Date(p.created_at), { locale: ko, addSuffix: true })}</span>
                      </div>
                      {p.tags.length > 0 && (
                        <div className="mt-3 flex gap-1 flex-wrap">
                          {p.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted">
                              <Hash className="h-2.5 w-2.5 inline -mt-0.5" />{t}
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
