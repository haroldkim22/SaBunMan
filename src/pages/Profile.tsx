import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Save } from "lucide-react";

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (profile) { setName(profile.display_name); setBio(profile.bio ?? ""); }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase.from("posts").select("*").eq("author_id", user.id)
      .order("created_at", { ascending: false }).then(({ data }) => setPosts(data ?? []));
  }, [user]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles")
      .update({ display_name: name, bio: bio || null }).eq("id", user.id);
    if (error) return toast.error("저장 실패");
    toast.success("프로필이 저장되었습니다");
    setEditing(false);
    refreshProfile();
  };

  if (!profile) return <AppLayout><div className="container py-20 text-center">로딩...</div></AppLayout>;
  const initials = profile.display_name.slice(0, 2).toUpperCase();

  return (
    <AppLayout>
      <div className="container py-6 px-4 md:py-8 max-w-3xl">
        
        <div className="rounded-2xl md:rounded-3xl gradient-hero p-5 md:p-8 text-primary-foreground shadow-elevated relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }} />
          
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-5">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 border-4 border-white/20 shrink-0 shadow-soft">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl md:text-2xl bg-white/20 font-bold">{initials}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 w-full">
              <h1 className="font-display text-xl md:text-3xl font-bold truncate">{profile.display_name}</h1>
              <p className="text-primary-foreground/70 text-xs md:text-sm truncate mt-0.5">{profile.email}</p>
              
              {profile.bio && !editing && (
                <p className="mt-3.5 text-slate-900 font-medium text-xs md:text-sm break-all leading-relaxed bg-white/90 backdrop-blur-sm px-3.5 py-2.5 rounded-xl inline-block text-left w-full sm:w-auto shadow-sm">
                  {profile.bio}
                </p>
              )}
            </div>

            {!editing && (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)} 
                className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0 h-8 text-xs justify-center bg-white/20 hover:bg-white/30 text-white border-0">
                <Pencil className="h-3 w-3 mr-1" />프로필 편집
              </Button>
            )}
          </div>
        </div>

        {editing && (
          <div className="mt-4 md:mt-6 rounded-2xl border border-border bg-card p-4 md:p-6 space-y-4 shadow-soft">
            <div>
              <Label htmlFor="b" className="text-xs md:text-sm">자기소개</Label>
              <Textarea id="b" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={200} className="mt-1.5 text-sm bg-muted/40" placeholder="나를 소개하는 글을 적어보세요." />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="flex-1 sm:flex-none h-9 text-xs md:text-sm">취소</Button>
              <Button onClick={save} size="sm" className="gradient-hero text-primary-foreground border-0 flex-1 sm:flex-none h-9 text-xs md:text-sm justify-center">
                <Save className="h-4 w-4 mr-1" />저장
              </Button>
            </div>
          </div>
        )}

        <section className="mt-8 md:mt-10">
          <div className="flex items-baseline justify-between mb-3 md:mb-4 px-1">
            <h2 className="font-display text-lg md:text-xl font-bold">내 게시물</h2>
            <span className="text-xs md:text-sm text-muted-foreground">{posts.length}건</span>
          </div>
          {posts.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-muted/20">
              <p className="text-xs md:text-sm text-muted-foreground mb-3">아직 등록한 게시물이 없어요.</p>
              <Button asChild size="sm"><Link to="/new">첫 게시물 등록하기</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {posts.map((p) => (
                <Link key={p.id} to={`/post/${p.id}`}
                  className="rounded-xl border border-border bg-card p-3.5 md:p-4 hover:shadow-soft hover:border-primary/40 transition-all block">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base text-foreground line-clamp-1">{p.title}</h3>
                      <p className="text-[11px] md:text-xs text-muted-foreground mt-1">
                        {p.type === "found" ? "주웠어요" : "잃어버렸어요"} · {p.floor ? `${p.floor}F` : "층 미지정"}
                      </p>
                    </div>
                    <Badge variant={p.status === "resolved" ? "secondary" : "default"} className="text-[10px] md:text-xs shrink-0 px-2 py-0">
                      {p.status === "resolved" ? "해결" : "진행중"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default Profile;