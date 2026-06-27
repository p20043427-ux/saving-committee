import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomTabBar } from "./BottomTabBar";
import { PageTransition } from "./PageTransition";
import { useState, useEffect } from "react";
import { CommandPalette } from "@/src/components/ui/CommandPalette";
import { useOrganization } from "@/src/components/layout/OrganizationProvider";

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { departments, buildings } = useOrganization();
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex h-screen bg-surface-100 text-surface-900 overflow-hidden font-sans">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary-700 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        본문으로 바로가기
      </a>

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onSearchClick={() => setCmdOpen(true)}
        />
        <main id="main-content" className="flex-1 overflow-auto">
          <div className="p-4 pb-20 md:p-8 md:pb-8">
            <div className="mx-auto w-full max-w-7xl">
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
          </div>
        </main>
        <BottomTabBar />
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        departments={departments}
        buildings={buildings}
      />
    </div>
  );
}
