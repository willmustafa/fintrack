"use client";

import CostsDivision from "@/components/costs-division";
import TipsCard from "@/components/tips-card";
import Neutral1 from "@/assets/tips/neutral-1.png";
import ValueCard from "@/components/value-card";
import EvolutionCard from "@/components/evolution-card";
import CreditCard from "@/components/credit-card";
import DashedCard from "@/components/dashed-card";
import Progress from "@/components/progress";
import { motion } from "framer-motion";
import { Select, SelectItem } from "@heroui/select";
import { Avatar } from "@heroui/avatar";
import { animals } from "@/components/income-form";
import Teste from "@/components/teste";

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
        <div>
          <h2 className="text-left mb-4 font-semibold text-lg">Cartões</h2>
          <div className="grid grid-cols-3 w-full gap-8">
            <CreditCard
              limit={2000}
              value={500}
              className="col-span-2"
              showArrow
            />
            <div className="flex flex-col">
              <div className="text-left mb-3">
                <h3>Faturas Abertas:</h3>
                <h2 className="text-lg font-semibold">R$ 450,33</h2>
              </div>
              <DashedCard className="min-h-24 h-full">Novo cartão</DashedCard>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-left mb-4">
            Planejamentos
          </h3>
          <div className="flex gap-4 flex-col">
            <Progress value={2800} title="Viagem Japão" maxValue={2800} />
            <Progress value={500} title="Viagem Japão" maxValue={2800} />
          </div>
        </div>
        <div>
          <Teste />
        </div>
      </div>
    </motion.div>
  );
}
