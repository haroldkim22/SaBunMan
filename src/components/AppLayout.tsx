import { ReactNode } from "react";
import { Header } from "./Header";

export const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">{children}</main>
    <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
      © 2026 사분만 · TEAM5 하정민 · 정영한 · 김동연
    </footer>
  </div>
);
