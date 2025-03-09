"use client";

import Sidebar from "@/components/sidebar";
import { Toaster } from "react-hot-toast";
import { ReactNode, useState } from "react";
import clsx from "clsx";
import DatePicker from "react-datepicker";
import "@/assets/styles/datepicker.css";
import { ptBR } from "date-fns/locale/pt-BR";
import Notifications from "@/components/notifications";
import { Link } from "@heroui/link";
import CompactCard from "@/components/CompactCard";
import { ArrowsUpFromLine } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <AnimatePresence mode="wait">
      <main className="bg-blue-50">
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
          <nav className="flex flex-row py-6 container justify-between items-center h-24 pr-10">
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
          <div className="inline-block text-center justify-center min-h-screen container m-auto pr-10">
            <Toaster position="top-right" />
            <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-6 mb-6">
              <CompactCard title="Saldo do mês" value={500}>
                <ArrowsUpFromLine width={16} />
              </CompactCard>
              <CompactCard title="Receitas" value={500}>
                <ArrowsUpFromLine width={16} />
              </CompactCard>
              <CompactCard title="Gastos" value={500}>
                <ArrowsUpFromLine width={16} />
              </CompactCard>
              <CompactCard title="Saldo" value={500}>
                <ArrowsUpFromLine width={16} />
              </CompactCard>
            </div>
            {children}
          </div>
        </section>
        <footer className="w-full flex items-center justify-center py-3">
          <Link
            isExternal
            className="flex items-center gap-1 text-current"
            href="https://willmustafa.github.io/"
            title="Willian Mustafa page"
          >
            <span className="text-default-600">
              Criado por Willian Mustafa - Acesse meu Github e me pague um café!
            </span>
          </Link>
        </footer>
      </main>
    </AnimatePresence>
  );
}
