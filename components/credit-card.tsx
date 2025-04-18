import { EditPencil, NavArrowRight } from "iconoir-react";
import clsx from "clsx";
import { Tooltip } from "@heroui/tooltip";
import { toCurrency } from "@/helpers/numbers";

export interface CreditCardProp {
  limit: number;
  value: number;
  name: string;
  due_date: string;
  background: string;
  className?: string;
  showArrow?: boolean;
  showEdit?: boolean;
  onEditClick?: (show: boolean) => void;
  onChangeCard?: () => void;
}

export default function CreditCard({
  limit,
  value,
  className,
  showArrow,
  showEdit,
  name,
  due_date,
  background,
  onEditClick = () => {},
  onChangeCard = () => {},
}: CreditCardProp) {
  const percentage = (value / limit) * 100;

  return (
    <div
      className={clsx(
        "bg-[var(--dark-blue)] rounded-2xl text-left text-white h-56 grid relative",
        className,
        showArrow ? "w-11/12" : "w-full",
      )}
    >
      {showArrow && (
        <Tooltip placement="right" content="Clique para mudar o cartão">
          <div
            className="absolute z-10 -right-6 top-5 bg-gray-600 rounded-tr-2xl rounded-br-2xl min-h-48 w-6 flex justify-center items-center hover:bg-gray-700 transition cursor-pointer hover:w-8 hover:-right-8"
            onClick={onChangeCard}
          >
            <NavArrowRight />
          </div>
        </Tooltip>
      )}
      {showEdit && (
        <div
          className="absolute right-4 top-4 text-gray-500 hover:text-white transition z-30 cursor-pointer"
          onClick={() => onEditClick(true)}
        >
          <EditPencil />
        </div>
      )}
      <div
        className="absolute h-full left-0 top-0 bg-black rounded-tl-2xl rounded-bl-2xl z-10 bg-cover bg-no-repeat bg-left opacity-80 transition-all"
        style={{
          backgroundImage: `url('${background}')`,
          width: `${percentage}%`,
        }}
      >
        <span className="text-[0.7rem] z-20 absolute bottom-1 text-right right-1">
          <p>{percentage}%</p>
          <p>do limite</p>
        </span>
      </div>
      <div className="h-full px-8 py-10 flex flex-col justify-between z-20">
        <h3 className="text-lg">{name}</h3>
        <h2 className="text-xl font-bold">{toCurrency(value)}</h2>
        <div className="flex flex-row text-small">
          <div className="w-3/4">
            <p>Limite</p>
            <p className="font-semibold">
              {toCurrency(limit, { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="w-1/4 text-right">
            <p>Venc.</p>
            <p className="font-semibold">{due_date}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
