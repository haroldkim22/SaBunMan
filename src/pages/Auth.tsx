import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";

const Auth = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) nav("/feed", { replace: true });
  }, [user, nav]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && loading) {
        setLoading(false);
        toast.error("구글 로그인 실패");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [loading]);

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
            <div className="font-display font-bold text-xl leading-none">사 분 만</div>
            <div className="text-[10px] tracking-wider opacity-70">SASA LOST & FOUND</div>
          </div>
        </Link>
        <div className="relative">
          <h2 className="font-display text-4xl font-bold leading-tight mb-3">
            잃어버린 물건이<br />4분만에 돌아오는
          </h2>
          <p className="text-primary-foreground/70">
            사진, 위치, 해시태그로 누구나 쉽게<br />분실물을 등록하고 찾을 수 있습니다
          </p>
        </div>
        <div className="relative text-xs opacity-60">2026 정보과학프로젝트</div>
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
            다시 만나서 반가워요
          </h1>
          <p className="text-muted-foreground mb-8">
            SASA 구글 계정으로 로그인해 주세요
          </p>

          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google로 계속하기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
