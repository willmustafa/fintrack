"use client";

import CostsDivision from "@/components/costs-division";
import TipsCard from "@/components/tips-card";
import Neutral1 from "@/assets/tips/neutral-1.png";
import ValueCard from "@/components/value-card";
import EvolutionCard from "@/components/evolution-card";
import Progress from "@/components/progress";
import { motion } from "framer-motion";
import CardSection from "@/components/card-section";

export default function DashboardPage() {
  return (
    <motion.div
      className="w-full grid grid-cols-1 gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid lg:grid-cols-2 grid-cols-1 gap-6">
        <div>
          <CostsDivision />
        </div>
        <div className="flex flex-col gap-6">
          <TipsCard
            title="Semana tranquila"
            message="Parece que essa semana não houveram nem gastos nem ganhos, as vezes é bom relaxar, se permita descansar."
            imageUrl={Neutral1}
          />
          <div className="flex flex-col text-left gap-4">
            <h2 className="text-lg font-semibold">Pendências</h2>
            <div className="grid grid-cols-2">
              <ValueCard title="Despesas" value={-500.43} />
              <ValueCard title="Receitas" value={500.43} />
            </div>
          </div>
        </div>

        <div>
          <EvolutionCard />
        </div>
        <CardSection />
        <div>
          <h3 className="text-lg font-semibold text-left mb-4">
            Planejamentos
          </h3>
          <div className="flex gap-4 flex-col">
            <Progress value={2800} title="Viagem Japão" maxValue={2800} />
            <Progress value={500} title="Viagem Japão" maxValue={2800} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
