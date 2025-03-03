"use client";
import { Card, CardBody, CardHeader } from "@heroui/card";
import ApexChart from "@/components/apex-chart";

export default function CostsDivision() {
  const option = {
    labels: ["Essenciais", "Investimentos", "Outros gastos"],
  };

  const serie = [50, 20, 30];

  return (
    <Card>
      <CardHeader>
        <h2>Divisão de gastos</h2>
      </CardHeader>
      <CardBody>
        <ApexChart type="donut" series={serie} options={option} />
      </CardBody>
    </Card>
  );
}
