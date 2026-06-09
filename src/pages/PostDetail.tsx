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
const typeStyle = { found: "bg-[#76b900] text-black", lost: "bg-[#000000] text-white" } as const;

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

  if (loading) return <AppLayout><div className="container mx-auto py-20 text-center text-[#757575] font-bold">불러오는 중...</div></AppLayout>;
  if (!post) return <AppLayout><div className="container mx-auto py-20 text-center font-bold text-black">게시물을 찾을 수 없습니다.</div></AppLayout>;

  const isOwner = user?.id === post.author_id;
  const initials = (post.profiles?.display_name ?? "?").slice(0, 2).toUpperCase();

  return (
    <AppLayout>
      <div className="container mx-auto py-12 px-12 max-w-5xl">
        <Button variant="ghost" asChild className="mb-8 rounded-sm font-bold px-0 hover:bg-transparent hover:text-[#76b900] text-black">
          <Link to="/feed"><ArrowLeft className="h-4 w-4 mr-2" />피드로 돌아가기</Link>
        </Button>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <div className="aspect-square rounded-none border border-[#cccccc] bg-[#f7f7f7] relative">
              <div className="absolute top-0 left-0 w-4 h-4 bg-[#76b900] z-10" />
              {post.image_url ? (
                <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
              ) : (
                <div className="h-full grid place-items-center text-[#cccccc]"><ImageOff className="h-12 w-12" /></div>
              )}
              <div className="absolute top-4 right-4 flex gap-2">
                <Badge className={`${typeStyle[post.type]} border border-[#cccccc] rounded-sm font-bold text-[12px] px-2.5 py-1`}>{typeLabel[post.type]}</Badge>
                {post.status === "resolved" && <Badge variant="secondary" className="bg-white text-black border border-[#cccccc] rounded-sm font-bold text-[12px] px-2.5 py-1">해결완료</Badge>}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="pb-6 border-b border-[#cccccc]">
              <h1 className="text-[36px] font-bold leading-[1.25] text-black">{post.title}</h1>
              <div className="flex items-center gap-3 mt-4">
                <Avatar className="h-8 w-8 rounded-sm border border-[#cccccc]">
                  <AvatarImage src={post.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[12px] font-bold bg-[#f7f7f7] text-black rounded-sm">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-[14px] font-bold text-black">{post.profiles?.display_name ?? "사용자"}</span>
                <span className="text-[14px] text-[#757575] font-bold">· {formatDistanceToNow(new Date(post.created_at), { locale: ko, addSuffix: true })}</span>
              </div>
            </div>

            {post.description && <p className="text-[16px] leading-[1.75] text-[#1a1a1a] whitespace-pre-wrap">{post.description}</p>}

            {post.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {post.tags.map((t) => (
                  <span key={t} className="text-[12px] font-bold bg-[#f7f7f7] border border-[#cccccc] text-[#1a1a1a] px-3 py-1 rounded-sm inline-flex items-center gap-1">
                    <Hash className="h-3 w-3" />{t}
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-sm border border-[#cccccc] bg-white p-6 relative">
              <div className="absolute top-0 right-0 w-2 h-2 bg-black" />
              <div className="flex items-center gap-2 text-[14px] font-bold mb-4 text-black uppercase tracking-wider">
                <MapPin className="h-4 w-4" />
                Location
              </div>
              <div className="text-[16px] font-bold mb-4 text-[#5e5e5e]">
                 {post.floor ? `${post.floor}층` : "층 미지정"} {post.location_label && `· ${post.location_label}`}
              </div>
              {post.floor && post.location_x != null && post.location_y != null && (
                <div className="border border-[#cccccc]">
                  <FloorMap floor={post.floor} selected={{ x: post.location_x, y: post.location_y }} className="mt-0" />
                </div>
              )}
            </div>

            {isOwner && (
              <div className="flex gap-3 pt-6">
                <Button onClick={toggleResolved} variant={post.status === "open" ? "default" : "outline"}
                  className={`flex-1 rounded-sm font-bold text-[16px] h-12 border-none ${post.status === "open" ? "bg-[#76b900] text-black hover:bg-[#5a8d00]" : "bg-[#f7f7f7] text-black border border-[#cccccc] hover:bg-[#e0e0e0]"}`}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {post.status === "open" ? "해결 완료로 표시" : "다시 미해결로"}
                </Button>
                <Button variant="outline" onClick={() => nav(`/post/${post.id}/edit`)} className="rounded-sm h-12 w-12 border-[#cccccc] text-black hover:bg-[#f7f7f7]">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={deletePost} className="rounded-sm h-12 w-12 border-[#cccccc] text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        <section className="mt-16 pt-12 border-t border-[#cccccc]">
          <h2 className="text-[24px] font-bold leading-[1.25] text-black mb-8">댓글 <span className="text-[#757575]">({comments.length})</span></h2>

          {user ? (
            <form onSubmit={addComment} className="flex gap-4 mb-10">
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="댓글을 입력하세요..." rows={2} maxLength={500} className="rounded-sm border-[#cccccc] focus-visible:border-[#76b900] focus-visible:ring-0 text-[16px] resize-none" />
              <Button type="submit" disabled={posting || !comment.trim()}
                className="bg-black text-white hover:bg-[#1a1a1a] rounded-sm font-bold h-auto px-6">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="rounded-sm border border-[#cccccc] bg-[#f7f7f7] p-6 text-[14px] font-bold text-[#5e5e5e] mb-10 text-center">
              댓글을 작성하려면 <Link to="/auth" className="text-[#76b900] hover:underline">로그인</Link>하세요.
            </div>
          )}

          <div className="space-y-4">
            {comments.length === 0 && <p className="text-[14px] font-bold text-[#757575] text-center py-12 border border-[#cccccc] rounded-sm">아직 댓글이 없어요.</p>}
            {comments.map((c) => {
              const ini = (c.profiles?.display_name ?? "?").slice(0, 2).toUpperCase();
              return (
                <div key={c.id} className="flex gap-4 rounded-sm border border-[#cccccc] bg-white p-6 relative">
                  <Avatar className="h-10 w-10 rounded-sm border border-[#cccccc]">
                    <AvatarImage src={c.profiles?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[12px] font-bold bg-[#f7f7f7] text-black rounded-sm">{ini}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 text-[14px]">
                      <span className="font-bold text-black">{c.profiles?.display_name ?? "사용자"}</span>
                      <span className="text-[12px] font-bold text-[#757575]">{formatDistanceToNow(new Date(c.created_at), { locale: ko, addSuffix: true })}</span>
                    </div>
                    <p className="text-[15px] mt-2 leading-[1.67] text-[#1a1a1a] whitespace-pre-wrap">{c.content}</p>
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
