import { PropsWithChildren } from "react";
import clsx from "clsx";

export interface DashedCardProps extends PropsWithChildren {
  className?: string;
  onClick?: () => void;
}

export default function DashedCard({
  children,
  className,
  onClick,
}: DashedCardProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-center w-full border-dashed border-2 border-[#201E31] rounded-2xl hover:bg-gray-200 transition cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
