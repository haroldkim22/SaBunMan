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
      <div className="container py-8 max-w-3xl">
        <div className="rounded-3xl gradient-hero p-8 text-primary-foreground shadow-elevated relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }} />
          <div className="relative flex items-start gap-5">
            <Avatar className="h-20 w-20 border-4 border-white/20">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl bg-white/20">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="font-display text-3xl font-bold">{profile.display_name}</h1>
              <p className="text-primary-foreground/70 text-sm">{profile.email}</p>
              {profile.bio && !editing && <p className="mt-3 text-primary-foreground/90">{profile.bio}</p>}
            </div>
            {!editing && (
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-3 w-3 mr-1" />편집
              </Button>
            )}
          </div>
        </div>

        {editing && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 space-y-4">
            {/* <div>
              <Label htmlFor="n">이름</Label>
              <Input id="n" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="mt-2" />
            </div> */}
            <div>
              <Label htmlFor="b">자기소개</Label>
              <Textarea id="b" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={200} className="mt-2" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditing(false)}>취소</Button>
              <Button onClick={save} className="gradient-hero text-primary-foreground border-0">
                <Save className="h-4 w-4 mr-1" />저장
              </Button>
            </div>
          </div>
        )}

        <section className="mt-10">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl font-bold">내 게시물</h2>
            <span className="text-sm text-muted-foreground">{posts.length}건</span>
          </div>
          {posts.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border">
              <p className="text-muted-foreground mb-3">아직 등록한 게시물이 없어요.</p>
              <Button asChild><Link to="/new">첫 게시물 등록하기</Link></Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {posts.map((p) => (
                <Link key={p.id} to={`/post/${p.id}`}
                  className="rounded-xl border border-border bg-card p-4 hover:shadow-soft hover:border-primary/40 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-1">{p.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {p.type === "found" ? "주웠어요" : "잃어버렸어요"} · {p.floor ? `${p.floor}F` : ""}
                      </p>
                    </div>
                    <Badge variant={p.status === "resolved" ? "secondary" : "default"} className="text-[10px]">
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
