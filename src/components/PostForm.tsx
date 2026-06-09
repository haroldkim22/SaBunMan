import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FloorMap } from "@/components/FloorMap";
import { toast } from "sonner";
import { Camera, Hash, X, Save, Upload } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  title: z.string().trim().min(1, "제목 필수").max(100),
  description: z.string().max(1000).optional(),
});

export type PostFormValues = {
  type: "found" | "lost";
  title: string;
  description: string;
  tags: string[];
  floor: number | null;
  pin: { x: number; y: number } | null;
  locationLabel: string;
  imageUrl: string | null;
  file: File | null;
};

type PostFormInitialValues = Partial<Omit<PostFormValues, "file">>;

type PostFormProps = {
  mode: "new" | "edit";
  initialValues?: PostFormInitialValues;
  submitting: boolean;
  onSubmit: (values: PostFormValues) => Promise<void>;
};

export const PostForm = ({ mode, initialValues, submitting, onSubmit }: PostFormProps) => {
  const [type, setType] = useState<"found" | "lost">(initialValues?.type ?? "found");
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [desc, setDesc] = useState(initialValues?.description ?? "");
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [floor, setFloor] = useState(initialValues?.floor ?? 1);
  const [pin, setPin] = useState<{ x: number; y: number } | null>(initialValues?.pin ?? null);
  const [unknownLocation, setUnknownLocation] = useState(
    (initialValues?.type ?? "found") === "lost" && initialValues?.floor == null && initialValues?.pin == null,
  );
  const [locationLabel, setLocationLabel] = useState(initialValues?.locationLabel ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initialValues?.imageUrl ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t) && tags.length < 8) setTags([...tags, t]);
    setTagInput("");
  };

  const handleFile = (f: File | null) => {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
    if (!f) setImageUrl(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      schema.parse({ title, description: desc });
    } catch (err: any) {
      return toast.error(err.errors[0].message);
    }

    const isLocationUnknown = type === "lost" && unknownLocation;
    await onSubmit({
      type,
      title,
      description: desc,
      tags,
      floor: isLocationUnknown ? null : floor,
      pin: isLocationUnknown ? null : pin,
      locationLabel,
      imageUrl,
      file,
    });
  };

  const currentImage = preview ?? imageUrl;
  const submitIcon = mode === "edit" ? <Save className="h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />;

  return (
    <form onSubmit={submit} className="grid lg:grid-cols-2 gap-12">
      <div className="space-y-8">
        <div>
          <Label className="mb-3 block text-[14px] font-bold text-black uppercase tracking-wider">유형</Label>
          <Tabs
            value={type}
            onValueChange={(v) => {
              setType(v as "found" | "lost");
              if (v === "found") setUnknownLocation(false);
            }}
          >
            <TabsList className="grid grid-cols-2 w-full p-0 bg-[#f7f7f7] border border-[#cccccc] rounded-sm h-12">
              <TabsTrigger value="found" className="rounded-none data-[state=active]:bg-black data-[state=active]:text-white font-bold text-[15px]">🔍 주웠어요</TabsTrigger>
              <TabsTrigger value="lost" className="rounded-none data-[state=active]:bg-black data-[state=active]:text-white font-bold text-[15px]">😢 잃어버렸어요</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div>
          <Label htmlFor="t" className="text-[14px] font-bold text-black uppercase tracking-wider">제목</Label>
          <Input
            id="t"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="검정 에어팟 프로 (3세대)"
            maxLength={100}
            required
            className="mt-3 rounded-sm border-[#cccccc] focus-visible:border-[#76b900] focus-visible:ring-0 text-[16px] h-12"
          />
        </div>

        <div>
          <Label htmlFor="d" className="text-[14px] font-bold text-black uppercase tracking-wider">설명</Label>
          <Textarea
            id="d"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="특징, 발견 시각 등을 적어주세요"
            rows={4}
            maxLength={1000}
            className="mt-3 rounded-sm border-[#cccccc] focus-visible:border-[#76b900] focus-visible:ring-0 text-[16px] resize-none"
          />
        </div>

        <div>
          <Label className="text-[14px] font-bold text-black uppercase tracking-wider">
            해시태그 <span className="text-[12px] text-[#757575] font-normal ml-1">(최대 8개)</span>
          </Label>
          <div className="flex gap-2 mt-3">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="검정, 에어팟, 전자기기..."
              className="rounded-sm border-[#cccccc] focus-visible:border-[#76b900] focus-visible:ring-0 text-[16px] h-12"
            />
            <Button type="button" variant="outline" onClick={addTag} className="rounded-sm font-bold border-[#cccccc] text-black h-12 px-6 hover:bg-[#f7f7f7]">
              추가
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-4">
              {tags.map((t) => (
                <span key={t} className="text-[12px] font-bold bg-[#f7f7f7] border border-[#cccccc] text-[#1a1a1a] px-3 py-1 rounded-sm inline-flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="ml-1 hover:bg-[#e0e0e0] p-0.5 rounded-sm">
                    <X className="h-3 w-3 text-black" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label className="text-[14px] font-bold text-black uppercase tracking-wider">사진</Label>
          <label className="mt-3 block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            {currentImage ? (
              <div className="relative rounded-sm overflow-hidden border border-[#cccccc]">
                <img src={currentImage} alt="preview" className="w-full aspect-video object-cover" />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute top-3 right-3 bg-white text-black border border-[#cccccc] hover:bg-[#f7f7f7] rounded-sm font-bold h-8 w-8 p-0"
                  onClick={(e) => {
                    e.preventDefault();
                    handleFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border border-dashed border-[#cccccc] rounded-sm p-12 text-center bg-[#f7f7f7] hover:border-black hover:bg-white transition-colors">
                <div className="grid place-items-center">
                  <div className="grid h-12 w-12 place-items-center bg-black text-white mb-4 rounded-sm">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div className="font-bold text-[16px] text-black">사진을 촬영하거나 선택</div>
                  <div className="text-[14px] text-[#757575] font-bold mt-1 uppercase tracking-wider">Optional</div>
                </div>
              </div>
            )}
          </label>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <Label className="mb-3 block text-[14px] font-bold text-black uppercase tracking-wider">발견 위치</Label>
          {type === "lost" && (
            <Tabs
              value={unknownLocation ? "unknown" : "map"}
              onValueChange={(v) => {
                const isUnknown = v === "unknown";
                setUnknownLocation(isUnknown);
                if (isUnknown) setPin(null);
              }}
              className="mb-4"
            >
              <TabsList className="grid grid-cols-2 w-full p-0 bg-[#f7f7f7] border border-[#cccccc] rounded-sm h-12">
                <TabsTrigger value="map" className="rounded-none data-[state=active]:bg-black data-[state=active]:text-white font-bold text-[14px]">지도에서 선택</TabsTrigger>
                <TabsTrigger value="unknown" className="rounded-none data-[state=active]:bg-black data-[state=active]:text-white font-bold text-[14px]">모르겠어요</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <div className="flex gap-2 mb-4 flex-wrap">
            {[1, 2, 3, 4, 5].map((f) => (
              <Button
                key={f}
                type="button"
                size="sm"
                variant={!unknownLocation && floor === f ? "default" : "outline"}
                className={`h-10 px-4 rounded-sm font-bold text-[14px] ${!unknownLocation && floor === f ? "bg-black text-white border-black" : "bg-white text-black border-[#cccccc] hover:bg-[#f7f7f7]"}`}
                disabled={unknownLocation}
                onClick={() => setFloor(f)}
              >
                {f}F
              </Button>
            ))}
          </div>
          <div className={`border border-[#cccccc] p-1 bg-white ${unknownLocation ? "pointer-events-none opacity-40 transition-opacity" : "transition-opacity"}`}>
            <FloorMap floor={floor} selected={pin} onClick={unknownLocation ? undefined : (x, y) => setPin({ x, y })} />
          </div>
          <p className="text-[13px] font-bold text-[#757575] mt-3 uppercase tracking-wider">
            {unknownLocation ? "위치를 모르는 상태로 등록됩니다." : "지도를 클릭해 위치를 표시하세요."}{" "}
            {pin && <span className="text-[#76b900] ml-1">✓ SELECTED</span>}
          </p>
        </div>

        <div>
          <Label htmlFor="loc" className="text-[14px] font-bold text-black uppercase tracking-wider">위치 설명 <span className="text-[12px] text-[#757575] font-normal ml-1">(선택)</span></Label>
          <Input
            id="loc"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            placeholder="예: 화학실 앞 사물함"
            className="mt-3 rounded-sm border-[#cccccc] focus-visible:border-[#76b900] focus-visible:ring-0 text-[16px] h-12"
          />
        </div>

        <Button type="submit" disabled={submitting} size="lg" className="w-full bg-[#76b900] text-black hover:bg-[#5a8d00] rounded-sm font-bold text-[18px] h-14 border-none transition-colors">
          {submitIcon}
          {submitting ? (mode === "edit" ? "저장 중..." : "등록 중...") : mode === "edit" ? "수정 저장" : "게시물 등록"}
        </Button>
      </div>
    </form>
  );
};
