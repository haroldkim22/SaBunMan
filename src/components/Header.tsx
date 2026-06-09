import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Search, Map, PlusCircle, User, LogOut, Sparkles } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Header = () => {
  const { user, profile, signOut } = useAuth();
  const nav = useNavigate();
  const initials = (profile?.display_name || user?.email || "?").slice(0, 2).toUpperCase();

  const link = "px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors";
  const active = "text-foreground bg-muted font-semibold";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4 px-4">
        
        {/* 로고 영역 */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-hero shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="font-display font-bold text-base block tracking-tight">사분만</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/feed" className={({ isActive }) => `${link} ${isActive ? active : ""}`}>
            <Search className="h-4 w-4 inline mr-1 -mt-0.5" />피드
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => `${link} ${isActive ? active : ""}`}>
            <Map className="h-4 w-4 inline mr-1 -mt-0.5" />지도
          </NavLink>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {/* PC뷰 전용 글쓰기 버튼 */}
          <Button onClick={() => nav("/new")} size="sm" variant="ghost" className="hidden md:flex h-9 text-xs">
            <PlusCircle className="h-4 w-4 mr-1" />게시물 등록
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 focus:outline-none hover:opacity-80 transition-opacity p-0.5 rounded-full">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-xs font-medium pr-1 text-slate-700">{profile?.display_name ?? "사용자"}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 mt-1">
                <DropdownMenuItem onClick={() => nav("/profile")} className="text-xs py-2">
                  <User className="h-3.5 w-3.5 mr-2 text-muted-foreground" />프로필 정보
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut().then(() => nav("/"))} className="text-xs py-2 text-destructive focus:text-destructive">
                  <LogOut className="h-3.5 w-3.5 mr-2" />로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => nav("/auth")} className="text-xs h-8">로그인</Button>
              <Button onClick={() => nav("/auth")} size="sm" className="gradient-hero text-primary-foreground border-0 text-xs h-8 px-3">
                시작하기
              </Button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};