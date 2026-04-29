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

  const link = "px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors";
  const active = "text-foreground bg-muted";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-hero shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none">사분만</div>
            <div className="text-[10px] text-muted-foreground tracking-wider">SASA LOST & FOUND</div>
          </div>
        </Link>

        {user && (
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/feed" className={({ isActive }) => `${link} ${isActive ? active : ""}`}>
              <Search className="inline h-4 w-4 mr-1.5" />피드
            </NavLink>
            <NavLink to="/map" className={({ isActive }) => `${link} ${isActive ? active : ""}`}>
              <Map className="inline h-4 w-4 mr-1.5" />지도
            </NavLink>
            <NavLink to="/new" className={({ isActive }) => `${link} ${isActive ? active : ""}`}>
              <PlusCircle className="inline h-4 w-4 mr-1.5" />등록
            </NavLink>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-card px-1.5 py-1 hover:shadow-soft transition-all">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium pr-2">{profile?.display_name ?? "사용자"}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => nav("/profile")}>
                  <User className="h-4 w-4 mr-2" />프로필
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav("/new")} className="md:hidden">
                  <PlusCircle className="h-4 w-4 mr-2" />등록
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut().then(() => nav("/"))}>
                  <LogOut className="h-4 w-4 mr-2" />로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={() => nav("/auth")}>로그인</Button>
              <Button onClick={() => nav("/auth?mode=signup")} className="gradient-hero text-primary-foreground border-0 hover:opacity-90">
                시작하기
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
