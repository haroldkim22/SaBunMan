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

      // profiles는 FK가 없어 별도 조회
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
      <div className="container py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-4 -ml-3">
          <Link to="/feed"><ArrowLeft className="h-4 w-4 mr-1" />피드로</Link>
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted relative">
              {post.image_url ? (
                <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
              ) : (
                <div className="h-full grid place-items-center text-muted-foreground"><ImageOff className="h-12 w-12" /></div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className={`${typeStyle[post.type]} border-0 font-bold`}>{typeLabel[post.type]}</Badge>
                {post.status === "resolved" && <Badge variant="secondary" className="bg-background/90 backdrop-blur">해결완료</Badge>}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight">{post.title}</h1>
              <div className="flex items-center gap-2 mt-3">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={post.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{post.profiles?.display_name ?? "사용자"}</span>
                <span className="text-xs text-muted-foreground">· {formatDistanceToNow(new Date(post.created_at), { locale: ko, addSuffix: true })}</span>
              </div>
            </div>

            {post.description && <p className="text-foreground/80 whitespace-pre-wrap">{post.description}</p>}

            {post.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {post.tags.map((t) => (
                  <span key={t} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                    <Hash className="h-3 w-3" />{t}
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                {post.floor ? `${post.floor}층` : "층 미지정"} {post.location_label && `· ${post.location_label}`}
              </div>
              {post.floor && post.location_x != null && post.location_y != null && (
                <FloorMap floor={post.floor} selected={{ x: post.location_x, y: post.location_y }} className="mt-2" />
              )}
            </div>

            {isOwner && (
              <div className="flex gap-2">
                <Button onClick={toggleResolved} variant={post.status === "open" ? "default" : "outline"}
                  className={post.status === "open" ? "gradient-hero text-primary-foreground border-0 flex-1" : "flex-1"}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {post.status === "open" ? "해결 완료" : "다시 열기"}
                </Button>
                <Button variant="outline" onClick={() => nav(`/post/${post.id}/edit`)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={deletePost} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        <section className="mt-12">
          <h2 className="font-display text-xl font-bold mb-4">댓글 {comments.length}</h2>

          {user ? (
            <form onSubmit={addComment} className="flex gap-2 mb-6">
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="댓글을 입력하세요..." rows={2} maxLength={500} />
              <Button type="submit" disabled={posting || !comment.trim()}
                className="gradient-hero text-primary-foreground border-0 self-end">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground mb-6">
              댓글을 작성하려면 <Link to="/auth" className="text-primary underline">로그인</Link>하세요.
            </div>
          )}

          <div className="space-y-3">
            {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">아직 댓글이 없어요.</p>}
            {comments.map((c) => {
              const ini = (c.profiles?.display_name ?? "?").slice(0, 2).toUpperCase();
              return (
                <div key={c.id} className="flex gap-3 rounded-xl border border-border bg-card p-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={c.profiles?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">{ini}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">{c.profiles?.display_name ?? "사용자"}</span>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { locale: ko, addSuffix: true })}</span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{c.content}</p>
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
