import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PostForm, type PostFormValues } from "@/components/PostForm";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

type LoadedPost = {
  type: "found" | "lost";
  title: string;
  description: string;
  tags: string[];
  floor: number | null;
  pin: { x: number; y: number } | null;
  locationLabel: string;
  imageUrl: string | null;
};

const EditPost = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<LoadedPost | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id || !user) return;

    supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          toast.error("게시물을 불러오지 못했습니다.", { description: error.message });
          nav("/feed");
          return;
        }
        if (!data) {
          toast.error("게시물을 찾을 수 없습니다.");
          nav("/feed");
          return;
        }
        if (data.author_id !== user.id) {
          toast.error("수정 권한이 없습니다.");
          nav(`/post/${id}`);
          return;
        }

        setPost({
          type: data.type as "found" | "lost",
          title: data.title,
          description: data.description ?? "",
          tags: data.tags ?? [],
          floor: data.floor,
          pin: data.location_x != null && data.location_y != null ? { x: data.location_x, y: data.location_y } : null,
          locationLabel: data.location_label ?? "",
          imageUrl: data.image_url ?? null,
        });
        setLoading(false);
      });
  }, [id, user, nav]);

  const uploadImage = async (file: File) => {
    if (!user) return null;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("post-images").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
  };

  const submit = async (values: PostFormValues) => {
    if (!id) return;
    setSubmitting(true);

    try {
      const imageUrl = values.file ? await uploadImage(values.file) : values.imageUrl;
      const { error } = await supabase
        .from("posts")
        .update({
          type: values.type,
          title: values.title,
          description: values.description || null,
          image_url: imageUrl,
          tags: values.tags,
          floor: values.floor,
          location_x: values.pin?.x ?? null,
          location_y: values.pin?.y ?? null,
          location_label: values.locationLabel || null,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("수정 완료!");
      nav(`/post/${id}`);
    } catch (error: any) {
      toast.error(values.file ? "사진 업로드 또는 수정 실패" : "수정 실패", { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !post) {
    return (
      <AppLayout>
        <div className="container py-20 text-center text-muted-foreground">불러오는 중...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-8 max-w-5xl">
        <Button variant="ghost" asChild className="mb-6 -ml-3">
          <Link to={`/post/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            게시물로 돌아가기
          </Link>
        </Button>

        <h1 className="font-display text-3xl font-bold mb-2">게시물 수정</h1>
        <p className="text-muted-foreground mb-8">내용을 수정하고 저장하세요.</p>
        <PostForm mode="edit" initialValues={post} submitting={submitting} onSubmit={submit} />
      </div>
    </AppLayout>
  );
};

export default EditPost;
