import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { TopNavbar } from "./TopNavbar";
import { BottomNav } from "./BottomNav";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-[#f6fff8] to-[#eef7f0]">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <TopNavbar />
        <main className="flex-1 p-3 sm:p-5 md:p-8 pb-20 sm:pb-24 md:pb-8 overflow-x-hidden overflow-y-auto w-full min-w-0">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
