import CompactCard from "@/components/CompactCard";
import { ArrowsUpFromLine } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="w-full">
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
    </div>
  );
}
