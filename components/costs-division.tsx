"use client";
import { Card, CardBody, CardHeader } from "@heroui/card";
import ApexChart from "@/components/apex-chart";
import { ApexOptions } from "apexcharts";

export default function CostsDivision() {
  const options: ApexOptions = {
    labels: ["Essenciais", "Investimentos", "Outros gastos"],
    dataLabels: {
      enabled: false,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "80%",
        },
      },
    },
    legend: {
      position: "right",
    },
  };

  const serie = [50, 20, 30];

  return (
    <Card className="h-72">
      <CardHeader>
        <h2>Divisão de gastos</h2>
      </CardHeader>
      <CardBody>
        <ApexChart
          type="donut"
          series={serie}
          options={options}
          height="100%"
        />
      </CardBody>
    </Card>
  );
}
