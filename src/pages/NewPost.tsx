import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FloorMap } from "@/components/FloorMap";
import { toast } from "sonner";
import { Camera, Hash, X, Upload } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  title: z.string().trim().min(1, "제목 필수").max(100),
  description: z.string().max(1000).optional(),
});

const NewPost = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [type, setType] = useState<"found" | "lost">("found");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [floor, setFloor] = useState(1);
  const [pin, setPin] = useState<{ x: number; y: number } | null>(null);
  const [unknownLocation, setUnknownLocation] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t) && tags.length < 8) setTags([...tags, t]);
    setTagInput("");
  };

  const handleFile = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try { schema.parse({ title, description: desc }); }
    catch (err: any) { return toast.error(err.errors[0].message); }
    setSubmitting(true);
    let image_url: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("post-images").upload(path, file);
      if (error) { setSubmitting(false); return toast.error("사진 업로드 실패", { description: error.message }); }
      image_url = supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
    }
    const { data, error } = await supabase.from("posts").insert({
      author_id: user.id, type, title, description: desc || null, image_url, tags,
      floor: unknownLocation ? null : floor,
      location_x: unknownLocation ? null : pin?.x ?? null,
      location_y: unknownLocation ? null : pin?.y ?? null,
      location_label: locationLabel || null,
    }).select().single();
    setSubmitting(false);
    if (error) return toast.error("등록 실패", { description: error.message });
    toast.success("등록 완료!");
    nav(`/post/${data.id}`);
  };

  return (
    <AppLayout>
      <div className="container py-8 max-w-5xl">
        <h1 className="font-display text-3xl font-bold mb-2">새 게시물</h1>
        <p className="text-muted-foreground mb-8">분실물 정보를 입력해주세요.</p>

        <form onSubmit={submit} className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <Label className="mb-2 block">유형</Label>
              <Tabs
                value={type}
                onValueChange={(v) => {
                  setType(v as "found" | "lost");
                  if (v === "found") setUnknownLocation(false);
                }}
              >
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="found">🔍 주웠어요</TabsTrigger>
                  <TabsTrigger value="lost">😢 잃어버렸어요</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <Label htmlFor="t">제목</Label>
              <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="검정 에어팟 프로 (3세대)" maxLength={100} required className="mt-2" />
            </div>

            <div>
              <Label htmlFor="d">설명</Label>
              <Textarea id="d" value={desc} onChange={(e) => setDesc(e.target.value)}
                placeholder="특징, 발견 시각 등을 적어주세요" rows={4} maxLength={1000} className="mt-2" />
            </div>

            <div>
              <Label>해시태그 <span className="text-xs text-muted-foreground">(최대 8개)</span></Label>
              <div className="flex gap-2 mt-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="검정, 에어팟, 전자기기..." />
                <Button type="button" variant="outline" onClick={addTag}>추가</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {tags.map((t) => (
                    <span key={t} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <Hash className="h-3 w-3" />{t}
                      <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}>
                        <X className="h-3 w-3 hover:text-destructive" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>사진</Label>
              <label className="mt-2 block cursor-pointer">
                <input type="file" accept="image/*" capture="environment" className="sr-only"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
                {preview ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img src={preview} alt="preview" className="w-full aspect-video object-cover" />
                    <Button type="button" size="sm" variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={(e) => { e.preventDefault(); handleFile(null); }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary hover:bg-muted/50 transition-colors">
                    <div className="grid place-items-center">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary mb-3">
                        <Camera className="h-5 w-5" />
                      </div>
                      <div className="font-medium">사진을 촬영하거나 선택</div>
                      <div className="text-xs text-muted-foreground mt-1">선택사항</div>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="mb-2 block">발견 위치</Label>
              {type === "lost" && (
                <Tabs
                  value={unknownLocation ? "unknown" : "map"}
                  onValueChange={(v) => {
                    const isUnknown = v === "unknown";
                    setUnknownLocation(isUnknown);
                    if (isUnknown) setPin(null);
                  }}
                  className="mb-3"
                >
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="map">지도에서 선택</TabsTrigger>
                    <TabsTrigger value="unknown">모르겠어요</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              <div className="flex gap-2 mb-3 flex-wrap">
                {[1, 2, 3, 4, 5].map((f) => (
                  <Button key={f} type="button" size="sm"
                    variant={!unknownLocation && floor === f ? "default" : "outline"}
                    className={!unknownLocation && floor === f ? "gradient-hero text-primary-foreground border-0" : ""}
                    disabled={unknownLocation}
                    onClick={() => setFloor(f)}>
                    {f}F
                  </Button>
                ))}
              </div>
              <div className={unknownLocation ? "pointer-events-none opacity-40 transition-opacity" : "transition-opacity"}>
                <FloorMap floor={floor} selected={pin} onClick={unknownLocation ? undefined : (x, y) => setPin({ x, y })} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {unknownLocation ? "위치를 모르는 상태로 등록됩니다." : "지도를 클릭해 위치를 표시하세요."} {pin && <span className="text-primary font-medium">✓ 선택됨</span>}
              </p>
            </div>

            <div>
              <Label htmlFor="loc">위치 설명 (선택)</Label>
              <Input id="loc" value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)}
                placeholder="예: 화학실 앞 사물함" className="mt-2" />
            </div>

            <Button type="submit" disabled={submitting} size="lg"
              className="w-full gradient-hero text-primary-foreground border-0 shadow-soft">
              <Upload className="h-4 w-4 mr-2" />
              {submitting ? "등록 중..." : "게시물 등록"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default NewPost;
