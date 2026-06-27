"use client";

import { useEffect, useState } from "react";
import { AdminDock } from "@/components/admin/AdminDock";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const savedValue = window.localStorage.getItem("admin-sidebar-collapsed");

    if (savedValue === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(true);
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((currentValue) => {
      const nextValue = !currentValue;
      window.localStorage.setItem(
        "admin-sidebar-collapsed",
        String(nextValue)
      );

      return nextValue;
    });
  }

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <div
        className={`mx-auto grid w-full max-w-[1600px] gap-6 px-4 py-6 md:px-6 ${
          collapsed
            ? "xl:grid-cols-[92px_minmax(0,1fr)]"
            : "xl:grid-cols-[280px_minmax(0,1fr)]"
        }`}
      >
        <AdminDock collapsed={collapsed} onToggle={toggleCollapsed} />

        <div className="min-w-0 pb-28 xl:pb-0">{children}</div>
      </div>
    </main>
  );
}