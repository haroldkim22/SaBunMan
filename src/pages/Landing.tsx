import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Camera, MapPin, Hash, MessageCircle, ArrowRight, Sparkles } from "lucide-react";

const features = [
  { icon: Camera, title: "사진 한 장으로 등록", desc: "주운 분실물을 사진과 함께 빠르게 게시" },
  { icon: MapPin, title: "층별 지도에 위치 표시", desc: "어디서 발견했는지 정확하게 핀으로" },
  { icon: Hash, title: "해시태그 검색 & 필터", desc: "색상, 종류, 날짜로 원하는 물건만" },
  { icon: MessageCircle, title: "댓글로 바로 소통", desc: "주인이 나타나면 작성자가 해결 처리" },
];

const Landing = () => {
  const { user } = useAuth();
  return (
    <AppLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 gradient-soft" />
        <div className="absolute -top-40 -right-40 -z-10 h-[500px] w-[500px] rounded-full bg-primary-glow/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 -z-10 h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl" />

        <div className="container py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-4 py-1.5 text-xs font-medium mb-6 shadow-sm">
              <Sparkles className="h-3 w-3 text-primary-glow" />
              SASA 학생·선생님을 위한 분실물 플랫폼
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-balance mb-6">
              사사의 분실물,<br />
              <span className="bg-gradient-to-r from-primary via-secondary to-primary-glow bg-clip-text text-transparent">
                4분만에 찾는다.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 text-balance max-w-2xl mx-auto">
              리로스쿨 분실물 게시판이 답답했다면. 사진, 지도, 해시태그로
              <br className="hidden md:inline" /> 누구나 쉽게 등록하고 한눈에 찾을 수 있도록.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gradient-hero text-primary-foreground border-0 hover:opacity-90 shadow-elevated">
                <Link to={user ? "/feed" : "/auth?mode=signup"}>
                  지금 시작하기 <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to={user ? "/map" : "/auth"}>지도 둘러보기</Link>
              </Button>
            </div>
          </motion.div>

          {/* Mock card preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="rounded-2xl border border-border bg-card shadow-elevated overflow-hidden">
              <div className="grid md:grid-cols-3 gap-0">
                {[
                  { tag: "찾음", color: "bg-success", title: "검정 에어팟 프로", loc: "3층 화학실 앞" },
                  { tag: "찾음", color: "bg-success", title: "파란색 우산", loc: "1층 현관" },
                  { tag: "찾는중", color: "bg-warning", title: "갈색 가죽 지갑", loc: "2층 어딘가" },
                ].map((c, i) => (
                  <div key={i} className="p-5 border-r border-border last:border-r-0">
                    <span className={`inline-block ${c.color} text-white text-[10px] font-bold px-2 py-0.5 rounded`}>{c.tag}</span>
                    <div className="mt-3 font-display font-semibold">{c.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{c.loc}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <div className="text-xs font-bold tracking-wider text-primary-glow mb-2">CORE FEATURES</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold">우리 학교만을 위한 핵심 기능</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="group rounded-2xl border border-border bg-card p-6 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="rounded-3xl gradient-hero p-10 md:p-16 text-center text-primary-foreground shadow-elevated overflow-hidden relative">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
          <h2 className="relative font-display text-3xl md:text-5xl font-bold mb-4">잃어버린 물건, 같이 찾아요.</h2>
          <p className="relative text-primary-foreground/80 mb-8 max-w-xl mx-auto">SASA 계정으로 로그인하고 첫 게시물을 등록해보세요.</p>
          <Button asChild size="lg" variant="secondary" className="relative">
            <Link to={user ? "/feed" : "/auth?mode=signup"}>피드로 이동 <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </AppLayout>
  );
};

export default Landing;
