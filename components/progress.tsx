import clsx from "clsx";
import { toCurrency } from "@/helpers/numbers";

type TailwindColor =
  | "slate"
  | "gray"
  | "zinc"
  | "neutral"
  | "stone"
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose";

export interface Progress {
  title: string;
  maxValue: number;
  value: number;
  variant?: TailwindColor;
}

export default function Progress({
  value,
  variant,
  maxValue,
  title,
}: Progress) {
  const percentage = Math.round((value / maxValue) * 100);
  const variantClasses: Record<TailwindColor, string> = {
    slate: "bg-slate-500 hover:bg-slate-600 border-slate-500",
    gray: "bg-gray-500 hover:bg-gray-600 border-gray-500",
    zinc: "bg-zinc-500 hover:bg-zinc-600 border-zinc-500",
    neutral: "bg-neutral-500 hover:bg-neutral-600 border-neutral-500",
    stone: "bg-stone-500 hover:bg-stone-600 border-stone-500",
    red: "bg-red-500 hover:bg-red-600 border-red-500",
    orange: "bg-orange-500 hover:bg-orange-600 border-orange-500",
    amber: "bg-amber-500 hover:bg-amber-600 border-amber-500",
    yellow: "bg-yellow-500 hover:bg-yellow-600 border-yellow-500",
    lime: "bg-lime-500 hover:bg-lime-600 border-lime-500",
    green: "bg-green-500 hover:bg-green-600 border-green-500",
    emerald: "bg-emerald-500 hover:bg-emerald-600 border-emerald-500",
    teal: "bg-teal-500 hover:bg-teal-600 border-teal-500",
    cyan: "bg-cyan-500 hover:bg-cyan-600 border-cyan-500",
    sky: "bg-sky-500 hover:bg-sky-600 border-sky-500",
    blue: "bg-blue-500 hover:bg-blue-600 border-blue-500",
    indigo: "bg-indigo-500 hover:bg-indigo-600 border-indigo-500",
    violet: "bg-violet-500 hover:bg-violet-600 border-violet-500",
    purple: "bg-purple-500 hover:bg-purple-600 border-purple-500",
    fuchsia: "bg-fuchsia-500 hover:bg-fuchsia-600 border-fuchsia-500",
    pink: "bg-pink-500 hover:bg-pink-600 border-pink-500",
    rose: "bg-rose-500 hover:bg-rose-600 border-rose-500",
  };

  return (
    <div className="flex items-center border-2 gap-3 border-gray-400 py-2 px-5 rounded-2xl">
      <div className="w-1/4 text-left break-words">
        <h2 className="font-semibold text-small">{title}</h2>
        <p className="text-[0.8rem]">
          {toCurrency(value)} / {toCurrency(maxValue)}
        </p>
      </div>
      <div className="w-3/4 relative py-2 overflow-hidden">
        <div
          className="text-right transition-transform !duration-500 absolute z-10 w-full top-0"
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        >
          <span
            className={clsx(
              "border-2 rounded-xl text-[0.7rem] px-2 py-1 !bg-white",
              variantClasses[variant ?? "blue"],
            )}
          >
            {percentage}%
          </span>
        </div>
        <div className="z-0 relative bg-default-300/50 overflow-hidden h-3 rounded-full">
          <div
            className={clsx(
              "h-full bg-primary rounded-full transition-transform !duration-500",
              variantClasses[variant ?? "blue"],
            )}
            style={{ transform: `translateX(-${100 - percentage}%)` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
