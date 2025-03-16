import { EditPencil } from "iconoir-react";
import clsx from "clsx";

export interface BankCardProp {
  className?: string;
  showEdit?: boolean;
  onEditClick?: (show: boolean) => void;
}

export default function BankCard({
  className,
  showEdit,
  onEditClick = () => {},
}: BankCardProp) {
  return (
    <div
      className={clsx(
        "bg-[var(--dark-blue)] rounded-2xl text-left text-white h-56 grid relative w-full",
        className,
      )}
    >
      <div
        className="absolute h-full left-0 top-0 bg-black rounded-2xl z-10 bg-cover bg-no-repeat bg-left opacity-40 w-full"
        style={{
          backgroundImage: `url('https://st2.depositphotos.com/3367263/49914/i/450/depositphotos_499146702-stock-photo-image-multiple-geometric-shapes-circles.jpg')`,
        }}
      ></div>
      <div className="h-full px-5 py-6 flex flex-col justify-between z-20">
        <div className="flex">
          <h3 className="text-lg w-5/6">NuBank</h3>
          <div className="flex z-30 justify-end w-1/6">
            <EditPencil
              width={18}
              className="cursor-pointer  text-gray-300 hover:text-white transition"
              onClick={() => onEditClick(true)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2">
          <div>
            <p className="text-small">Saldo atual</p>
            <h2 className="text-xl font-bold">R$ 500,00</h2>
          </div>
          <div className="text-end">
            <p className="text-small">Saldo previsto</p>
            <h2 className="text-xl font-bold">R$ 500,00</h2>
          </div>
        </div>
        <div className="flex flex-row text-small">
          <div className="w-3/4">
            <p className="text-small">Saldo destinado à um objetivo</p>
            <p className="font-semibold">R$ 2.000</p>
          </div>
        </div>
      </div>
    </div>
  );
}
