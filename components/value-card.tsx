import { toCurrency } from "@/helpers/numbers";
import clsx from "clsx";

export interface ValueCardProps {
  title: string;
  value: number;
}

export default function ValueCard({ title, value }: ValueCardProps) {
  return (
    <div
      className={clsx(
        "before:content-[''] before:w-2 before:rounded-2xl before:h-full h-full w-full flex flex-row",
        value < 0 ? "before:bg-red-400" : "before:bg-green-400",
      )}
    >
      <div className="flex flex-col w-full text-left ps-3">
        <h3>{title}</h3>
        <h2
          className={clsx(
            "text-lg font-semibold",
            value < 0 ? "text-red-400" : "text-green-400",
          )}
        >
          {toCurrency(Math.abs(value))}
        </h2>
      </div>
    </div>
  );
}
