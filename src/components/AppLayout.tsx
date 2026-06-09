import { ReactNode } from "react";
import { Header } from "./Header";

export const AppLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">{children}</main>
    <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
      2026 SaBunMan | 김동연 · 정영한 · 하정민
    </footer>
  </div>
);
