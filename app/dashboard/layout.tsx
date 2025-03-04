"use client";

import Sidebar from "@/components/sidebar";
import { Toaster } from "react-hot-toast";
import { useState } from "react";
import clsx from "clsx";
import DatePicker from "react-datepicker";
import "@/assets/styles/datepicker.css";
import { ptBR } from "date-fns/locale/pt-BR";
import { Bell } from "iconoir-react";
import Notifications from "@/components/notifications";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <main className="bg-slate-50">
      <Sidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />
      <section
        className={clsx(
          "flex flex-col items-center justify-center gap-4 pb-8 md:pb-10 transition-all duration-300",
          !isSidebarCollapsed ? "ml-64" : "ml-28",
        )}
      >
        <nav className="flex flex-row py-6 container justify-between items-center h-24">
          <h2 className="text-base font-semibold uppercase">Dashboard</h2>
          <div className="relative w-56">
            <DatePicker
              selected={selectedDate}
              onChange={(date) =>
                setSelectedDate(new Date(date?.toString() ?? ""))
              }
              dateFormat="MMMM / yyyy"
              showMonthYearPicker
              locale={ptBR}
            />
          </div>
          <div>
            <Notifications />
          </div>
        </nav>
        <div className="inline-block text-center justify-center min-h-screen container m-auto">
          <Toaster position="top-right" />
          {children}
        </div>
      </section>
    </main>
  );
}
