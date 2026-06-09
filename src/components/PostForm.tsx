import { useEffect, useState, useRef, type FormEvent } from "react";
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

  // Refs for hidden file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
const fileInputRef = useRef<HTMLInputElement>(null);

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
          <Input
            id="t"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="검정 에어팟 프로 (3세대)"
            maxLength={100}
            required
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="d">설명</Label>
          <Textarea
            id="d"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="특징, 발견 시각 등을 적어주세요"
            rows={4}
            maxLength={1000}
            className="mt-2"
          />
        </div>

        <div>
          <Label>
            해시태그 <span className="text-xs text-muted-foreground">(최대 8개)</span>
          </Label>
          <div className="flex gap-2 mt-2">
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
            />
            <Button type="button" variant="outline" onClick={addTag}>
              추가
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-3">
              {tags.map((t) => (
                <span key={t} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  {t}
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
          <div className="mt-2 flex gap-2">
            <Button type="button" variant="outline" onClick={() => cameraInputRef.current?.click()}>
              <Camera className="mr-2 h-4 w-4" /> 카메라
            </Button>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> 갤러리
            </Button>
          </div>
          {/* Hidden inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {currentImage ? (
            <div className="relative rounded-xl overflow-hidden border border-border mt-4">
              <img src={currentImage} alt="preview" className="w-full aspect-video object-cover" />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.preventDefault();
                  handleFile(null);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : null}
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
              <Button
                key={f}
                type="button"
                size="sm"
                variant={!unknownLocation && floor === f ? "default" : "outline"}
                className={!unknownLocation && floor === f ? "gradient-hero text-primary-foreground border-0" : ""}
                disabled={unknownLocation}
                onClick={() => setFloor(f)}
              >
                {f}F
              </Button>
            ))}
          </div>
          <div className={unknownLocation ? "pointer-events-none opacity-40 transition-opacity" : "transition-opacity"}>
            <FloorMap floor={floor} selected={pin} onClick={unknownLocation ? undefined : (x, y) => setPin({ x, y })} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {unknownLocation ? "위치를 모르는 상태로 등록됩니다." : "지도를 클릭해 위치를 표시하세요."}{" "}
            {pin && <span className="text-primary font-medium">✓ 선택됨</span>}
          </p>
        </div>

        <div>
          <Label htmlFor="loc">위치 설명 (선택)</Label>
          <Input
            id="loc"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            placeholder="예: 화학실 앞 사물함"
            className="mt-2"
          />
        </div>

        <Button type="submit" disabled={submitting} size="lg" className="w-full gradient-hero text-primary-foreground border-0 shadow-soft">
          {submitIcon}
          {submitting ? (mode === "edit" ? "저장 중..." : "등록 중...") : mode === "edit" ? "수정 저장" : "게시물 등록"}
        </Button>
      </div>
    </form>
  );
};
