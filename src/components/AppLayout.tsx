import { ReactNode } from "react";
import { Header } from "./Header";
import { NavLink } from "react-router-dom";
import { Search, Map, PlusCircle } from "lucide-react";

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const mobileLink = "flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-foreground transition-colors";
  const mobileActive = "text-primary font-semibold";

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0 bg-background">
      <Header />
      
      <main className="flex-1">{children}</main>
      
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground hidden md:block">
        2026 SaBunMan | 김동연 · 정영한 · 하정민
      </footer>

      {/* 폰 하단 네비게이션 바 */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-lg border-t border-border/80 flex items-center justify-around z-50 md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-2">
        {/* 1. 피드 탭 */}
        <NavLink 
          to="/feed" 
          className={({ isActive }) => `${mobileLink} ${isActive ? mobileActive : ""}`}
        >
          <Search className="h-5 w-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">피드</span>
        </NavLink>

        {/* 2. 글쓰기 탭 */}
        <NavLink 
          to="/new" 
          className={({ isActive }) => `${mobileLink} ${isActive ? mobileActive : ""}`}
        >
          <PlusCircle className="h-5 w-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">글쓰기</span>
        </NavLink>

        {/* 3. 지도 탭 */}
        <NavLink 
          to="/map" 
          className={({ isActive }) => `${mobileLink} ${isActive ? mobileActive : ""}`}
        >
          <Map className="h-5 w-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">지도</span>
        </NavLink>
      </nav>
    </div>
  );
};