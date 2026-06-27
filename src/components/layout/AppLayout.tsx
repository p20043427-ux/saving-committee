import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
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
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onSearchClick={() => setCmdOpen(true)}
        />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </div>
        </main>
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
