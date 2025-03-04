"use client";
import dynamic from "next/dynamic";
import { Props } from "react-apexcharts";
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function Chart(props: Props) {
  return (
    <>
      <ApexChart {...props} />
    </>
  );
}
