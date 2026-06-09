import { ReactNode } from "react";
import { Header } from "./Header";

export const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-white">
    <Header />
    <main className="flex-1">{children}</main>
    <footer className="bg-black text-white/70 py-16 px-12">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h4 className="text-white font-bold text-[16px] mb-4">SABUNMAN</h4>
          <p className="text-[15px]">SASA 분실물 플랫폼</p>
        </div>
        <div>
          <h4 className="text-white font-bold text-[16px] mb-4">TEAM5</h4>
          <ul className="space-y-2 text-[15px]">
            <li>하정민</li>
            <li>정영한</li>
            <li>김동연</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto mt-16 pt-8 border-t border-[#5e5e5e] text-[10px] font-bold uppercase tracking-wider text-[#a7a7a7]">
        © 2026 SABUNMAN. ALL RIGHTS RESERVED.
      </div>
    </footer>
  </div>
);
