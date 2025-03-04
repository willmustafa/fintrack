import CompactCard from "@/components/CompactCard";
import { ArrowsUpFromLine } from "lucide-react";
import CostsDivision from "@/components/costs-division";
import TipsCard from "@/components/tips-card";
import Neutral1 from "@/assets/tips/neutral-1.png";
import ValueCard from "@/components/value-card";
import EvolutionCard from "@/components/evolution-card";

export default function DashboardPage() {
  return (
    <div className="w-full grid grid-cols-1 gap-6">
      <div className="grid grid-cols-4 gap-6">
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
      <div className="grid lg:grid-cols-2 grid-cols-1 gap-y-6">
        {/*<CostsDivision />*/}
        {/*<TipsCard*/}
        {/*  title="Semana tranquila"*/}
        {/*  message="Parece que essa semana não houveram nem gastos nem ganhos, as vezes é bom relaxar, se permita descansar."*/}
        {/*  imageUrl={Neutral1}*/}
        {/*/>*/}
        <div className="flex flex-col text-left gap-4">
          <h2 className="text-lg font-semibold">Pendências</h2>
          <div className="grid grid-cols-2">
            <ValueCard title="Despesas" value={-500.43} />
            <ValueCard title="Receitas" value={500.43} />
          </div>
        </div>
        <div>
          <EvolutionCard />
        </div>
      </div>
    </div>
  );
}
