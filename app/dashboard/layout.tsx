"use client";

import Sidebar from "@/components/sidebar";
import { Toaster } from "react-hot-toast";
import { useState } from "react";
import clsx from "clsx";

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  return (
    <main className="bg-slate-50">
      <Sidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />
      <section
        className={clsx(
          "flex flex-col items-center justify-center gap-4 py-8 md:py-10 transition-all duration-300",
          !isSidebarCollapsed ? "ml-64" : "ml-28",
        )}
      >
        <div className="inline-block text-center justify-center min-h-screen container m-auto">
          <Toaster position="top-right" />
          {children}
        </div>
      </section>
    </main>
  );
}
