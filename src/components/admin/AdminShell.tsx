"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AdminDock } from "@/components/admin/AdminDock";

type AdminShellProps = {
  children: ReactNode;
};

const STORAGE_KEY =
  "admin-sidebar-collapsed";

export function AdminShell({
  children,
}: AdminShellProps) {
  const [collapsed, setCollapsed] =
    useState(false);

  const [mounted, setMounted] =
    useState(false);

  useEffect(() => {
    const savedValue =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(savedValue === "true");
    setMounted(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((currentValue) => {
      const nextValue = !currentValue;

      window.localStorage.setItem(
        STORAGE_KEY,
        String(nextValue)
      );

      return nextValue;
    });
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#f4f6f7] text-[#0a0f14]">
      {/* Fondo decorativo */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-[#e7edf1]/75 blur-3xl" />

        <div className="absolute -bottom-48 -left-40 h-[440px] w-[440px] rounded-full bg-slate-200/60 blur-3xl" />
      </div>

      <div
        className={`relative mx-auto grid w-full max-w-[1720px] gap-5 px-4 py-4 transition-[grid-template-columns] duration-300 md:px-6 md:py-6 ${collapsed
            ? "xl:grid-cols-[88px_minmax(0,1fr)]"
            : "xl:grid-cols-[270px_minmax(0,1fr)]"
          }`}
      >
        <AdminDock
          collapsed={collapsed}
          onToggle={toggleCollapsed}
        />

        <section
          className={`min-w-0 pb-28 transition-opacity duration-200 xl:pb-0 ${mounted
              ? "opacity-100"
              : "opacity-0"
            }`}
        >
          {children}
        </section>
      </div>
    </main>
  );
}