import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FloorMap } from "@/components/FloorMap";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Trash2, CheckCircle2, ImageOff, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

type Post = {
  id: string; type: "found" | "lost"; title: string; description: string | null;
  image_url: string | null; tags: string[]; floor: number | null;
  location_x: number | null; location_y: number | null; location_label: string | null;
  status: "open" | "resolved"; created_at: string; author_id: string;
  profiles?: { display_name: string; avatar_url: string | null } | null;
};
type Comment = {
  id: string; content: string; created_at: string; author_id: string;
  profiles?: { display_name: string; avatar_url: string | null } | null;
};

const typeLabel = { found: "주웠어요", lost: "잃어버렸어요" } as const;
const typeStyle = { found: "bg-success text-success-foreground", lost: "bg-warning text-warning-foreground" } as const;

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPost = async () => {
    if (!id) return;
    const { data: p } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
    if (!p) { setPost(null); setLoading(false); return; }
    
    const { data: prof } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", p.author_id).maybeSingle();
    const { data: comms } = await supabase.from("comments").select("*").eq("post_id", id).order("created_at", { ascending: true });
    
    const cIds = Array.from(new Set((comms ?? []).map((c) => c.author_id)));
    const cProfMap: Record<string, any> = {};
    if (cIds.length) {
      const { data: cProfs } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", cIds);
      (cProfs ?? []).forEach((pr) => { cProfMap[pr.id] = pr; });
    }

    setPost({ ...p, profiles: prof } as any);
    setComments((comms ?? []).map((c) => ({ ...c, profiles: cProfMap[c.author_id] ?? null })) as any);
    setLoading(false);
  };

  useEffect(() => { fetchPost(); }, [id]);

  const toggleStatus = async () => {
    if (!post) return;
    const next = post.status === "open" ? "resolved" : "open";
    const { error } = await supabase.from("posts").update({ status: next }).eq("id", post.id);
    if (error) return toast.error("상태 변경 실패");
    toast.success(next === "resolved" ? "해결 완료 처리되었습니다" : "다시 미해결 상태로 변경되었습니다");
    fetchPost();
  };

  const deletePost = async () => {
    if (!post || !window.confirm("정말 이 게시물을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) return toast.error("삭제 실패");
    toast.success("게시물이 삭제되었습니다");
    nav("/feed");
  };

  const writeComment = async () => {
    if (!user || !newComment.trim() || !id) return;
    const { error } = await supabase.from("comments").insert({ post_id: id, author_id: user.id, content: newComment.trim() });
    if (error) return toast.error("댓글 등록 실패");
    setNewComment("");
    fetchPost();
  };

  if (loading) return <AppLayout><div className="container py-20 text-center text-sm">불러오는 중...</div></AppLayout>;
  if (!post) return <AppLayout><div className="container py-20 text-center text-sm">존재하지 않는 게시물입니다.</div></AppLayout>;

  const ini = (post.profiles?.display_name ?? "?").slice(0, 2).toUpperCase();
  const isOwner = user?.id === post.author_id;

  return (
    <AppLayout>

      <div className="container py-5 px-4 md:py-10 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => nav(-nav ? "/feed" : -1 as any)} className="mb-5 -ml-2 text-muted-foreground text-xs h-8">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> 목록으로
        </Button>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6 md:gap-8 items-start">
          <div className="space-y-6 md:space-y-8">
            
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-soft shrink-0">
              <div className="aspect-[16/10] bg-muted relative">
                {post.image_url ? (
                  <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted-foreground bg-muted/40">
                    <ImageOff className="h-10 w-10 opacity-40" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <Badge className={`${typeStyle[post.type]} border-0 font-bold text-[10px] md:text-xs px-2 py-0.5`}>
                    {typeLabel[post.type]}
                  </Badge>
                  <Badge variant={post.status === "resolved" ? "secondary" : "default"} className="text-[10px] md:text-xs px-2 py-0.5">
                    {post.status === "resolved" ? "해결완료" : "해결중"}
                  </Badge>
                </div>
              </div>

              {/*텍스트 밀도*/}
              <div className="p-4 md:p-6 space-y-4">
                <div className="space-y-1.5">
                  <h1 className="font-display text-lg md:text-2xl font-bold tracking-tight text-foreground leading-snug">
                    {post.title}
                  </h1>
                  <div className="flex items-center gap-2 text-[11px] md:text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{post.profiles?.display_name ?? "사용자"}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(post.created_at), { locale: ko })} 전</span>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-4">
                  <p className="text-xs md:text-base text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                    {post.description ?? "상세 설명이 등록되지 않은 게시물입니다."}
                  </p>
                </div>

                {post.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap pt-2">
                    {post.tags.map((t) => (
                      <span key={t} className="text-[10px] md:text-xs px-2.5 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/*댓글창 간격 조정*/}
            <section className="bg-card rounded-2xl border border-border p-4 md:p-6 shadow-soft space-y-4">
              <h2 className="font-display text-sm md:text-lg font-bold text-foreground">댓글 {comments.length}개</h2>
              
              {user ? (
                <div className="flex gap-2 items-start bg-muted/30 p-2 rounded-xl border border-border/40">
                  <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)}
                    placeholder="정보를 알고 계시다면 댓글을 남겨주세요..."
                    className="min-h-[44px] h-11 text-xs md:text-sm resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 py-2.5 px-2" />
                  <Button size="icon" variant="ghost" onClick={writeComment} className="h-9 w-9 shrink-0 text-primary hover:bg-primary/10">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 bg-muted/40 rounded-xl text-[11px] md:text-xs text-muted-foreground">
                  댓글을 작성하려면 <Link to="/auth" className="text-primary underline font-semibold">로그인</Link>이 필요합니다.
                </div>
              )}

              <div className="space-y-3 pt-1">
                {comments.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">첫 댓글을 남겨보세요.</p>
                )}
                {comments.map((c) => {
                  const cIni = (c.profiles?.display_name ?? "?").slice(0, 2).toUpperCase();
                  return (
                    <div key={c.id} className="flex gap-2.5 rounded-xl border border-border/50 bg-muted/10 p-3 items-start">
                      <Avatar className="h-7 w-7 md:h-8 md:w-8 shrink-0">
                        <AvatarImage src={c.profiles?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{cIni}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs md:text-sm text-foreground">{c.profiles?.display_name ?? "사용자"}</span>
                          <span className="text-[10px] text-muted-foreground opacity-80">{formatDistanceToNow(new Date(c.created_at), { locale: ko })} 전</span>
                        </div>
                        <p className="text-xs md:text-sm text-slate-700 mt-1 whitespace-pre-wrap leading-normal">{c.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* 사이드 위치 섹션 */}
          <div className="space-y-4 w-full lg:sticky lg:top-20">
            <div className="bg-card rounded-2xl border border-border p-4 shadow-soft space-y-3.5">
              <div className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>위치 정보</span>
              </div>
              
              <div className="aspect-square bg-muted rounded-xl relative overflow-hidden border border-border/60">
                {post.floor && post.location_x ? (
                  <FloorMap floor={post.floor} markers={[{ id: post.id, x: post.location_x, y: post.location_y ?? 0, type: post.type, title: post.title, floor: post.floor }]} />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-[11px] md:text-xs text-muted-foreground bg-muted/40">위치 마커가 지정되지 않았습니다.</div>
                )}
              </div>
              <div className="text-center text-xs font-medium text-slate-700 bg-muted/50 py-2 rounded-lg">
                {post.floor ? `${post.floor}층` : ""} {post.location_label ?? "상세 위치 미지정"}
              </div>
            </div>

            {isOwner && (
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={toggleStatus} className="flex-1 h-9 text-xs font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-success" />
                  {post.status === "open" ? "해결 완료" : "다시 진행하기"}
                </Button>
                <Button variant="destructive" size="sm" onClick={deletePost} className="h-9 text-xs font-medium px-3">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PostDetail;