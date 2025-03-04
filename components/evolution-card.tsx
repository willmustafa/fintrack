import Chart from "@/components/apex-chart";
import { ApexOptions } from "apexcharts";

export default function EvolutionCard() {
  const barSeries = [
    {
      name: "Income",
      type: "column",
      data: [1.4, 2, 2.5, 1.5, 2.5, 2.8, 3.8, 4.6],
    },
    {
      name: "Cashflow",
      type: "column",
      data: [1.1, 3, 3.1, 4, 4.1, 4.9, 6.5, 8.5],
    },
    {
      name: "Revenue",
      type: "line",
      data: [20, 29, 37, 36, 44, 45, 50, 58],
    },
  ];
  const barOptions: ApexOptions = {
    stroke: {
      width: [1, 1, 4],
    },
    title: {
      text: "Evolução",
      align: "left",
      offsetX: 30,
      offsetY: 50,
      style: {
        fontSize: "1.35rem",
      },
    },
    xaxis: {
      categories: [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016],
    },
    yaxis: [
      {
        seriesName: "Income",
        axisTicks: {
          show: true,
        },
        axisBorder: {
          show: true,
          color: "#008FFB",
        },
        labels: {
          style: {
            colors: "#008FFB",
          },
        },
        title: {
          text: "Income (thousand crores)",
          style: {
            color: "#008FFB",
          },
        },
        tooltip: {
          enabled: true,
        },
      },
      {
        seriesName: "Cashflow",
        opposite: true,
        axisTicks: {
          show: true,
        },
        axisBorder: {
          show: true,
          color: "#00E396",
        },
        labels: {
          style: {
            colors: "#00E396",
          },
        },
        title: {
          text: "Operating Cashflow (thousand crores)",
          style: {
            color: "#00E396",
          },
        },
      },
      {
        seriesName: "Revenue",
        opposite: true,
        axisTicks: {
          show: true,
        },
        axisBorder: {
          show: true,
          color: "#FEB019",
        },
        labels: {
          style: {
            colors: "#FEB019",
          },
        },
        title: {
          text: "Revenue (thousand crores)",
          style: {
            color: "#FEB019",
          },
        },
      },
    ],
    legend: {
      position: "top",
      horizontalAlign: "right",
      offsetY: -30,
    },
    chart: {
      toolbar: {
        show: false,
      },
    },
  };

  return (
    <Chart
      type="line"
      options={barOptions}
      series={barSeries}
      toolbar={false}
    />
  );
}
