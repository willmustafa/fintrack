"use client";

import { motion } from "framer-motion";
import DashedCard from "@/components/dashed-card";
import CreditCard from "@/components/credit-card";

export default function DashboardPage() {
  return (
    <motion.div
      className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <DashedCard className="min-h-44 h-full">Novo cartão</DashedCard>
      <CreditCard limit={2000} value={500} showEdit />
      <CreditCard limit={2000} value={500} showEdit />
    </motion.div>
  );
}
