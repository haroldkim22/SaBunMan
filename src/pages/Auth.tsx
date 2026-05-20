import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Mail, Lock, User as UserIcon } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("올바른 이메일 형식이 아닙니다").max(255);
const pwSchema = z.string().min(8, "비밀번호는 8자 이상").max(72);
const nameSchema = z.string().trim().min(1, "이름을 입력하세요").max(40);

const Auth = () => {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState(params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) nav("/feed", { replace: true }); }, [user, nav]);

  const validateSasa = (e: string) => {
    if (!e.endsWith("@sasa.hs.kr")) {
      toast.warning("SASA 이메일(@sasa.hs.kr) 사용을 권장합니다", { description: "다른 이메일도 사용 가능합니다." });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email); pwSchema.parse(pw);
    } catch (err: any) { toast.error(err.errors?.[0]?.message ?? "입력 확인"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) return toast.error("로그인 실패", { description: error.message });
    toast.success("환영합니다!");
    nav("/feed");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email); pwSchema.parse(pw); nameSchema.parse(name);
    } catch (err: any) { toast.error(err.errors?.[0]?.message ?? "입력 확인"); return; }
    validateSasa(email);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password: pw,
      options: { emailRedirectTo: window.location.origin, data: { display_name: name } },
    });
    setLoading(false);
    if (error) return toast.error("가입 실패", { description: error.message });
    toast.success("계정이 생성되었습니다!");
    nav("/feed");
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        queryParams: { hd: "sasa.hs.kr", prompt: "select_account" },
      }
    });
    if (error) { 
      setLoading(false); 
      return toast.error("구글 로그인 실패"); 
    }
    // Supabase signInWithOAuth automatically redirects the browser.
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative gradient-hero p-12 flex-col justify-between text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }} />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display font-bold text-xl leading-none">사분만</div>
            <div className="text-[10px] tracking-wider opacity-70">SASA LOST & FOUND</div>
          </div>
        </Link>
        <div className="relative">
          <h2 className="font-display text-4xl font-bold leading-tight mb-3">
            잃어버린 물건이<br />4분만에 주인 품으로.
          </h2>
          <p className="text-primary-foreground/70 max-w-sm">
            사진, 위치, 해시태그로 누구나 쉽게 분실물을 등록하고 찾아봅니다.
          </p>
        </div>
        <div className="relative text-xs opacity-60">TEAM5 · 정과프 프로젝트</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-hero">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">사분만</span>
          </Link>

          <h1 className="font-display text-3xl font-bold mb-2">
            {tab === "signin" ? "다시 만나서 반가워요" : "시작해볼까요"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {tab === "signin" ? "계정으로 로그인하세요" : "SASA 이메일로 가입하세요"}
          </p>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="signin">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="e1">이메일</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="e1" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@sasa.hs.kr" className="pl-9" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p1">비밀번호</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="p1" type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                      placeholder="8자 이상" className="pl-9" required />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full gradient-hero text-primary-foreground border-0">
                  로그인
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="n2">이름</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="n2" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="홍길동" className="pl-9" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="e2">이메일</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="e2" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@sasa.hs.kr" className="pl-9" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p2">비밀번호</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="p2" type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                      placeholder="8자 이상" className="pl-9" required />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full gradient-hero text-primary-foreground border-0">
                  가입하기
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">또는</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google로 계속하기
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-6">
            가입하면 <Link to="/" className="underline">서비스 약관</Link>에 동의하는 것입니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
