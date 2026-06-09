import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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

  if (!profile) return <AppLayout><div className="container mx-auto py-20 text-center text-[#757575] font-bold">로딩...</div></AppLayout>;
  const initials = profile.display_name.slice(0, 2).toUpperCase();

  return (
    <AppLayout>
      <div className="container mx-auto py-12 px-12 max-w-4xl">
        <div className="bg-black p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-3 h-3 bg-[#76b900] z-10" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 border-2 border-[#5e5e5e] rounded-sm">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-[24px] font-bold bg-[#1a1a1a] text-white rounded-sm">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-white">
              <h1 className="text-[32px] font-bold leading-tight">{profile.display_name}</h1>
              <p className="text-[16px] text-[#cccccc] font-bold mt-1">{profile.email}</p>
              {profile.bio && !editing && <p className="mt-4 text-[16px] leading-[1.6] text-white/90">{profile.bio}</p>}
            </div>
            {!editing && (
              <Button variant="outline" className="h-10 px-4 rounded-sm font-bold border-[#5e5e5e] text-white bg-transparent hover:bg-white hover:text-black hover:border-white transition-colors" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />프로필 편집
              </Button>
            )}
          </div>
        </div>

        {editing && (
          <div className="mt-6 border border-[#cccccc] bg-[#f7f7f7] p-8 space-y-6">
            <div>
              <Label htmlFor="b" className="text-[14px] font-bold text-black uppercase tracking-wider mb-2 block">Bio</Label>
              <Textarea id="b" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={200} className="w-full rounded-sm border-[#cccccc] focus-visible:border-[#76b900] focus-visible:ring-0 text-[16px] resize-none" placeholder="자기소개를 입력하세요..." />
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-[#cccccc]">
              <Button variant="outline" onClick={() => setEditing(false)} className="rounded-sm font-bold h-10 px-6 border-[#cccccc] text-black hover:bg-[#e0e0e0]">취소</Button>
              <Button onClick={save} className="bg-[#76b900] text-black hover:bg-[#5a8d00] rounded-sm font-bold h-10 px-6 border-none">
                <Save className="h-4 w-4 mr-2" />변경사항 저장
              </Button>
            </div>
          </div>
        )}

        <section className="mt-16 border-t border-[#cccccc] pt-12">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-[24px] font-bold leading-[1.25] text-black">내 게시물</h2>
            <span className="text-[14px] font-bold text-[#757575]">{posts.length}건의 등록된 아이템</span>
          </div>
          
          {posts.length === 0 ? (
            <div className="text-center py-16 border border-[#cccccc] bg-[#f7f7f7] rounded-sm">
              <p className="text-[16px] font-bold text-[#757575] mb-6">아직 등록한 게시물이 없어요.</p>
              <Button asChild className="bg-black text-white hover:bg-[#1a1a1a] rounded-sm font-bold h-12 px-8">
                <Link to="/new">첫 게시물 등록하기</Link>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {posts.map((p) => (
                <Link key={p.id} to={`/post/${p.id}`}
                  className="block border border-[#cccccc] bg-white p-5 hover:border-black transition-colors relative group">
                  <div className="absolute top-0 left-0 w-2 h-2 bg-[#76b900] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[17px] font-bold text-black line-clamp-1 leading-[1.4] mb-2">{p.title}</h3>
                      <p className="text-[14px] font-bold text-[#757575]">
                        {p.type === "found" ? "주웠어요" : "잃어버렸어요"} <span className="mx-1">·</span> {p.floor ? `${p.floor}F` : "위치 미지정"}
                      </p>
                    </div>
                    <Badge variant={p.status === "resolved" ? "secondary" : "default"} className={`rounded-sm font-bold text-[12px] px-2 py-0.5 border ${p.status === "resolved" ? "bg-white text-black border-[#cccccc]" : "bg-black text-white border-black"}`}>
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
