import Chart from "@/components/apex-chart";
import { ApexOptions } from "apexcharts";
import { toCurrency } from "@/helpers/numbers";
import colors from "tailwindcss/colors";
import { useState } from "react";
import clsx from "clsx";

export default function EvolutionCard() {
  const barSeries: ApexOptions["series"] = [
    {
      name: "Gastos",
      type: "column",
      data: [500, 450, 1200, 900, 700, 900, 1300, 400],
      color: colors.red["500"],
    },
    {
      name: "Receitas",
      type: "column",
      data: [1000, 1300, 3000, 4000, 4100, 4900, 6500, 850],
      color: colors.green["500"],
    },
    {
      name: "Saldo",
      type: "line",
      data: [500, 2000, 5000, 6800, 8000, 10000, 15000, 16000],
      color: colors.yellow["500"],
    },
  ];

  const barOptions: ApexOptions = {
    stroke: {
      width: [1, 1, 4],
    },
    xaxis: {
      categories: [
        "Mar/2025",
        "Abr/2025",
        "Mai/2025",
        "Jun/2025",
        "Jul/2025",
        "Ago/2025",
        "Set/2025",
        "Out/2025",
      ],
    },
    yaxis: [
      {
        show: true,
        seriesName: "Gastos",
        axisTicks: {
          show: true,
        },
        axisBorder: {
          show: true,
        },
        title: {
          text: "Gastos e Receitas",
        },
        tooltip: {
          enabled: true,
        },
        labels: {
          formatter: (val: number, opts?: any): string | string[] => {
            return toCurrency(val, { maximumFractionDigits: 0 });
          },
        },
      },
      {
        show: true,
        seriesName: "Receitas",
        axisTicks: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        labels: {
          show: false,
        },
      },
      {
        show: true,
        seriesName: "Saldo",
        opposite: true,
        axisTicks: {
          show: true,
        },
        axisBorder: {
          show: true,
          color: colors.yellow["500"],
        },
        labels: {
          style: {
            colors: colors.yellow["500"],
          },
          formatter: (val: number, opts?: any): string | string[] => {
            return toCurrency(val, { maximumFractionDigits: 0 });
          },
        },
        title: {
          text: "Saldo",
        },
      },
    ],
    legend: {
      show: false,
    },
    chart: {
      toolbar: {
        show: false,
      },
    },
    tooltip: {
      y: {
        formatter: (val: number, opts?: any) => {
          return toCurrency(val);
        },
      },
    },
  };

  const [filteredOptions, setFilteredOptions] = useState(barOptions);
  const [filteredSeries, setFilteredSeries] =
    useState<ApexOptions["series"]>(barSeries);

  function toggleSeries(serie?: string) {
    const found = filteredSeries?.find(
      (original) => (original as any).name === serie,
    );
    const _options = Object.assign({}, filteredOptions);

    if (found && filteredSeries) {
      setFilteredSeries(
        filteredSeries.filter(
          (original) => (original as any).name !== serie,
        ) as any,
      );
      if (Array.isArray(_options.yaxis)) {
        const foundOption = _options.yaxis?.find(
          (original) => original.seriesName === serie,
        );
        if (foundOption) {
          foundOption.show = true;
          setFilteredOptions(_options);
        }
      }
    } else {
      setFilteredSeries([
        ...(filteredSeries as any),
        barSeries?.find((original) => (original as any).name === serie) as any,
      ]);
      if (Array.isArray(_options.yaxis)) {
        const foundOption = _options.yaxis.find(
          (original) => original.seriesName === serie,
        );
        if (foundOption) {
          foundOption.show = false;
          setFilteredOptions(_options);
        }
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold text-left mb-4">Evolução</h3>
        <div className="flex justify-between gap-4">
          {barSeries.map((serie) => (
            <div
              className={clsx(
                "flex gap-1 items-center cursor-pointer",
                !filteredSeries?.find(
                  (original) => (original as any).name === serie.name,
                ) && "opacity-30",
              )}
              onClick={() => toggleSeries(serie.name)}
              key={serie.name}
            >
              <span
                className="rounded-2xl w-6 h-4"
                style={{ backgroundColor: serie.color }}
              ></span>
              <p className="text-sm">{serie.name}</p>
            </div>
          ))}
        </div>
      </div>

      <Chart type="line" options={filteredOptions} series={filteredSeries} />
    </div>
  );
}
