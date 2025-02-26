import Sidebar from "@/components/sidebar";

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <Toaster position="top-right" />
          {children}
        </div>
      </section>
    </>
  );
}

import { Toaster } from "react-hot-toast";
