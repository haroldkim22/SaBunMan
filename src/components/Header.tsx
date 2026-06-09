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

  const link = "px-3 py-2 text-[16px] font-bold text-white/70 hover:text-white transition-colors rounded-none";
  const active = "text-[#76b900]";

  return (
    <header className="sticky top-0 z-40 w-full bg-black text-white h-16 border-b border-[#5e5e5e]">
      <div className="container h-full flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-8 w-8 place-items-center bg-[#76b900] rounded-none">
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <div>
            <div className="font-bold text-[20px] leading-none text-white tracking-tight">SABUNMAN</div>
          </div>
        </Link>

        {user && (
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/feed" className={({ isActive }) => `${link} ${isActive ? active : ""}`}>
              피드
            </NavLink>
            <NavLink to="/map" className={({ isActive }) => `${link} ${isActive ? active : ""}`}>
              지도
            </NavLink>
            <NavLink to="/new" className={({ isActive }) => `${link} ${isActive ? active : ""}`}>
              등록
            </NavLink>
          </nav>
        )}

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-sm border border-[#5e5e5e] bg-transparent px-2 py-1 hover:border-white transition-all text-white">
                  <Avatar className="h-6 w-6 rounded-none">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[11px] bg-white text-black font-bold rounded-none">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-[14px] font-bold">{profile?.display_name ?? "사용자"}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-sm bg-white text-black border-[#cccccc]">
                <DropdownMenuItem onClick={() => nav("/profile")} className="rounded-sm cursor-pointer font-bold text-[14px]">
                  프로필
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav("/new")} className="md:hidden rounded-sm cursor-pointer font-bold text-[14px]">
                  등록
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#cccccc]" />
                <DropdownMenuItem onClick={() => signOut().then(() => nav("/"))} className="rounded-sm cursor-pointer text-black font-bold text-[14px]">
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={() => nav("/auth")} className="text-white hover:text-white hover:bg-[#1a1a1a] rounded-sm font-bold">로그인</Button>
              <Button onClick={() => nav("/auth?mode=signup")} className="bg-[#76b900] text-black hover:bg-[#5a8d00] rounded-sm font-bold border-none px-6">
                시작하기
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

