import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PostForm, type PostFormValues } from "@/components/PostForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const NewPost = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const uploadImage = async (file: File) => {
    if (!user) return null;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("post-images").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
  };

  const submit = async (values: PostFormValues) => {
    if (!user) return;
    setSubmitting(true);

    try {
      const imageUrl = values.file ? await uploadImage(values.file) : null;
      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
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
        .select()
        .single();

      if (error) throw error;
      toast.success("등록 완료!");
      nav(`/post/${data.id}`);
    } catch (error: any) {
      toast.error(values.file ? "사진 업로드 또는 등록 실패" : "등록 실패", { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-12 px-12 max-w-6xl">
        <div className="mb-10 pb-6 border-b border-[#cccccc]">
          <h1 className="text-[36px] font-bold leading-[1.25] text-black">새 게시물</h1>
          <p className="text-[16px] text-[#757575] font-bold mt-2">분실물 정보를 입력해주세요.</p>
        </div>
        <PostForm mode="new" submitting={submitting} onSubmit={submit} />
      </div>
    </AppLayout>
  );
};

export default NewPost;
