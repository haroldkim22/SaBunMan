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
import { ArrowLeft, MapPin, Hash, Trash2, CheckCircle2, ImageOff, Send, Pencil } from "lucide-react";
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
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const [{ data: p }, { data: cs }] = await Promise.all([
        supabase.from("posts").select("*").eq("id", id).maybeSingle(),
        supabase.from("comments").select("*").eq("post_id", id).order("created_at"),
      ]);

      const userIds = Array.from(new Set([
        ...(p ? [p.author_id] : []),
        ...((cs ?? []).map((c: any) => c.author_id)),
      ]));
      const profileMap: Record<string, any> = {};
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles").select("id, display_name, avatar_url").in("id", userIds);
        (profs ?? []).forEach((pr: any) => { profileMap[pr.id] = pr; });
      }

      setPost(p ? ({ ...p, profiles: profileMap[(p as any).author_id] ?? null } as any) : null);
      setComments(((cs ?? []) as any[]).map((c) => ({ ...c, profiles: profileMap[c.author_id] ?? null })) as any);
    } catch (e: any) {
      toast.error("데이터를 불러오지 못했어요: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user || !id) return;
    setPosting(true);
    const { error } = await supabase.from("comments").insert({ post_id: id, author_id: user.id, content: comment.trim() });
    setPosting(false);
    if (error) return toast.error("댓글 실패");
    setComment("");
    load();
  };

  const toggleResolved = async () => {
    if (!post) return;
    const newStatus = post.status === "open" ? "resolved" : "open";
    const { error } = await supabase.from("posts").update({ status: newStatus }).eq("id", post.id);
    if (error) return toast.error("처리 실패 :" + error.message);
    toast.success(newStatus === "resolved" ? "해결 처리되었습니다" : "다시 미해결로");
    load();
  };

  const deletePost = async () => {
    if (!post || !confirm("정말 삭제하시겠어요?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) return toast.error("처리 실패 :" + error.message);
    toast.success("삭제되었습니다");
    nav("/feed");
  };

  if (loading) return <AppLayout><div className="container py-20 text-center text-muted-foreground">불러오는 중...</div></AppLayout>;
  if (!post) return <AppLayout><div className="container py-20 text-center">게시물을 찾을 수 없습니다.</div></AppLayout>;

  const isOwner = user?.id === post.author_id;
  const initials = (post.profiles?.display_name ?? "?").slice(0, 2).toUpperCase();

  return (
    <AppLayout>
      <div className="container py-6 md:py-8 px-4 md:px-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-4 -ml-3 h-9 text-xs md:text-sm text-muted-foreground">
          <Link to="/feed"><ArrowLeft className="h-4 w-4 mr-1" />피드로</Link>
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          {/* 좌측: 이미지 영역 */}
          <div>
            <div className="aspect-square rounded-xl md:rounded-2xl overflow-hidden bg-muted relative shadow-soft border border-border/40">
              {post.image_url ? (
                <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
              ) : (
                <div className="h-full grid place-items-center text-muted-foreground bg-muted/30">
                  <ImageOff className="h-10 w-10 md:h-12 md:w-12 opacity-60" />
                </div>
              )}
              <div className="absolute top-3 left-3 md:top-4 md:left-4 flex gap-1.5">
                <Badge className={`${typeStyle[post.type]} border-0 font-bold text-[10px] md:text-xs px-2.5 py-0.5`}>
                  {typeLabel[post.type]}
                </Badge>
                {post.status === "resolved" && (
                  <Badge variant="secondary" className="bg-background/90 backdrop-blur text-[10px] md:text-xs px-2 py-0.5">해결완료</Badge>
                )}
              </div>
            </div>
          </div>

          {/* 우측: 디테일 정보 텍스트 설명 영역 */}
          <div className="space-y-4 md:space-y-5">
            <div>
              <h1 className="font-display text-xl md:text-3xl font-bold leading-tight tracking-tight text-foreground">
                {post.title}
              </h1>
              <div className="flex items-center gap-2 mt-2.5">
                <Avatar className="h-6 w-6 md:h-7 md:w-7 border border-border/40">
                  <AvatarImage src={post.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px] md:text-xs bg-primary text-primary-foreground font-bold">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-xs md:text-sm font-medium text-foreground">{post.profiles?.display_name ?? "사용자"}</span>
                <span className="text-[11px] md:text-xs text-muted-foreground">
                  · {formatDistanceToNow(new Date(post.created_at), { locale: ko, addSuffix: true })}
                </span>
              </div>
            </div>

            {post.description && (
              <p className="text-sm md:text-base text-foreground/90 whitespace-pre-wrap leading-relaxed border-t border-border/40 pt-4">
                {post.description}
              </p>
            )}

            {post.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap pt-1">
                {post.tags.map((t) => (
                  <span key={t} className="text-[11px] md:text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full inline-flex items-center gap-0.5 font-medium">
                    <Hash className="h-3 w-3 opacity-70" />{t}
                  </span>
                ))}
              </div>
            )}

            {/* 위치 카드 */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-foreground mb-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{post.floor ? `${post.floor}층` : "층 미지정"} {post.location_label && `· ${post.location_label}`}</span>
              </div>
              {post.floor && post.location_x != null && post.location_y != null && (
                /* 💡 수정 포인트: 고정 비율(aspect)을 지우고, FloorMap 내부 맵 이미지 고유 사이즈대로 채워지도록 설정 */
                <div className="w-full h-auto rounded-lg overflow-hidden border border-border/60">
                  <FloorMap floor={post.floor} selected={{ x: post.location_x, y: post.location_y }} />
                </div>
              )}
            </div>

            {/* 작성자 액션 컨트롤 버튼 바 */}
            {isOwner && (
              <div className="flex gap-2 pt-1">
                <Button onClick={toggleResolved} variant={post.status === "open" ? "default" : "outline"}
                  className={post.status === "open" ? "gradient-hero text-primary-foreground border-0 flex-1 h-10 text-xs md:text-sm" : "flex-1 h-10 text-xs md:text-sm"}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {post.status === "open" ? "해결 완료" : "다시 진행하기"}
                </Button>
                <Button variant="outline" size="icon" onClick={() => nav(`/post/${post.id}/edit`)} className="h-10 w-10 shrink-0">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={deletePost} className="h-10 w-10 shrink-0 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 💬 하단 타임라인형 댓글 섹션 */}
        <section className="mt-10 md:mt-14 border-t border-border/60 pt-6 md:pt-8">
          <h2 className="font-display text-base md:text-xl font-bold text-foreground mb-4">댓글 {comments.length}</h2>

          {user ? (
            <form onSubmit={addComment} className="flex gap-2 mb-6 items-end">
              <div className="flex-1">
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="정보를 알고 계시다면 따뜻한 댓글을 남겨주세요..." rows={2} maxLength={500}
                  className="text-xs md:text-sm bg-muted/40 resize-none focus-visible:ring-1" />
              </div>
              <Button type="submit" disabled={posting || !comment.trim()}
                className="gradient-hero text-primary-foreground border-0 h-10 px-4 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="rounded-xl bg-muted/40 p-4 text-center text-xs md:text-sm text-muted-foreground mb-6">
              댓글을 작성하려면 <Link to="/auth" className="text-primary underline font-semibold">로그인</Link>이 필요합니다.
            </div>
          )}

          <div className="space-y-3">
            {comments.length === 0 && (
              <p className="text-xs md:text-sm text-muted-foreground text-center py-10 opacity-70">아직 등록된 댓글이 없습니다.</p>
            )}
            {comments.map((c) => {
              const ini = (c.profiles?.display_name ?? "?").slice(0, 2).toUpperCase();
              return (
                <div key={c.id} className="flex gap-3 rounded-xl border border-border/40 bg-card p-3.5 shadow-sm">
                  <Avatar className="h-7 w-7 md:h-8 md:w-8 shrink-0 border border-border/20">
                    <AvatarImage src={c.profiles?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[10px] md:text-xs bg-primary/10 text-primary font-bold">{ini}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs md:text-sm text-foreground truncate">{c.profiles?.display_name ?? "사용자"}</span>
                      <span className="text-[10px] md:text-xs text-muted-foreground opacity-80">
                        {formatDistanceToNow(new Date(c.created_at), { locale: ko, addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm mt-1 whitespace-pre-wrap text-slate-700 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default PostDetail;