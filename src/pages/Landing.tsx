import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, MapPin, Hash, MessageCircle, ArrowRight } from "lucide-react";

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
      {/* Hero Chapter */}
      <section className="bg-black py-20 px-12 relative overflow-hidden">
        <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="z-10 text-white max-w-xl">
            <h1 className="text-[48px] font-bold leading-[1.25] mb-6">
              사사의 분실물,<br />
              4분만에 찾는다.
            </h1>
            <p className="text-[22px] font-normal leading-[1.75] text-white/70 mb-10">
              리로스쿨 분실물 게시판이 답답했다면. 사진, 지도, 해시태그로 누구나 쉽게 등록하고 한눈에 찾을 수 있도록.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="bg-[#76b900] text-black hover:bg-[#5a8d00] rounded-sm font-bold text-[18px] px-6 h-12 border-none">
                <Link to={user ? "/feed" : "/auth?mode=signup"}>
                  지금 시작하기
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-black rounded-sm font-bold text-[18px] px-6 h-12">
                <Link to={user ? "/map" : "/auth"}>지도 둘러보기</Link>
              </Button>
            </div>
          </div>
          {/* Mockup / Image area */}
          <div className="hidden lg:block h-[400px] border border-[#5e5e5e] bg-[#1a1a1a] relative">
             <div className="absolute top-0 left-0 w-3 h-3 bg-[#76b900]" />
             <div className="w-full h-full flex items-center justify-center text-[#5e5e5e] font-bold tracking-widest uppercase">
               System Visualization
             </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Chapter */}
      <section className="container mx-auto py-16 px-12">
        <div className="mb-12">
          <h2 className="text-[36px] font-bold leading-[1.25] text-black">우리 학교만을 위한 핵심 기능</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="relative rounded-sm border border-[#cccccc] bg-white p-8 group"
            >
              <div className="absolute top-0 left-0 w-3 h-3 bg-[#76b900]" />
              <div className="text-[#76b900] mb-6">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-[20px] font-bold leading-[1.25] mb-2">{f.title}</h3>
              <p className="text-[16px] leading-[1.5] text-[#1a1a1a]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preview Chapter */}
      <section className="bg-[#f7f7f7] py-16 px-12 border-t border-b border-[#cccccc]">
        <div className="container mx-auto">
          <div className="mb-12">
            <h2 className="text-[36px] font-bold leading-[1.25] text-black">최근 분실물 현황</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { tag: "주웠어요", title: "검정 에어팟 프로", loc: "3층 화학실 앞" },
              { tag: "주웠어요", title: "파란색 우산", loc: "1층 현관" },
              { tag: "잃어버렸어요", title: "갈색 가죽 지갑", loc: "2층 어딘가" },
            ].map((c, i) => (
              <div key={i} className="relative rounded-sm border border-[#cccccc] bg-white p-6">
                <div className="absolute top-0 right-0 w-3 h-3 bg-[#76b900]" />
                <span className="inline-block bg-[#f7f7f7] text-[#1a1a1a] text-[14px] font-bold px-2.5 py-1 rounded-sm mb-4 border border-[#cccccc]">
                  {c.tag}
                </span>
                <div className="text-[17px] font-bold leading-[1.47] mb-2">{c.title}</div>
                <div className="text-[15px] text-[#757575] flex items-center gap-1">
                  <MapPin className="h-4 w-4" />{c.loc}
                </div>
                <div className="mt-6 flex justify-end">
                   <div className="text-[#76b900] text-[15px] font-bold uppercase cursor-pointer hover:underline flex items-center">
                     Read More <ArrowRight className="ml-1 h-4 w-4" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Strip Chapter */}
      <section className="bg-black py-16 px-12">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-[24px] font-bold leading-[1.25] text-white mb-2">잃어버린 물건, 같이 찾아요.</h2>
            <p className="text-[16px] text-white/70">SASA 계정으로 로그인하고 첫 게시물을 등록해보세요.</p>
          </div>
          <Button asChild className="bg-[#76b900] text-black hover:bg-[#5a8d00] rounded-sm font-bold text-[18px] px-8 h-12 border-none">
            <Link to={user ? "/feed" : "/auth?mode=signup"}>피드로 이동</Link>
          </Button>
        </div>
      </section>
    </AppLayout>
  );
};

export default Landing;

