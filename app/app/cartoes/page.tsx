"use client";

import { Card, CardBody } from "@heroui/card";
import { motion } from "framer-motion";

export default function DashboardPage() {
  return (
    <motion.div
      className="w-full grid grid-cols-1 gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-none">
        <CardBody>Cartões</CardBody>
      </Card>
    </motion.div>
  );
}
