import { NavArrowRight } from "iconoir-react";

export interface CreditCardProp {
  limit: number;
  value: number;
}

export default function CreditCard({ limit, value }: CreditCardProp) {
  const percentage = (value / limit) * 100;
  return (
    <div className="bg-[var(--dark-blue)] rounded-2xl text-left text-white min-h-56 grid relative">
      <div className="absolute z-10 -right-6 top-5 bg-gray-600 rounded-tr-2xl rounded-br-2xl min-h-48 w-6 flex justify-center items-center">
        <NavArrowRight />
      </div>
      <div
        className="absolute h-full left-0 top-0 bg-black rounded-tl-2xl rounded-bl-2xl z-10 bg-cover bg-no-repeat bg-left opacity-80"
        style={{
          backgroundImage: `url('https://st2.depositphotos.com/3367263/49914/i/450/depositphotos_499146702-stock-photo-image-multiple-geometric-shapes-circles.jpg')`,
          width: `${percentage}%`,
        }}
      ></div>
      <span
        className="text-[0.7rem] z-20 absolute bottom-1 text-right"
        style={{ left: `${percentage - 8}%` }}
      >
        <p>{percentage}%</p>
        <p>do limite</p>
      </span>
      <div className="h-full px-8 py-10 flex flex-col justify-between z-20">
        <h3 className="text-lg">NuBank</h3>
        <h2 className="text-xl font-bold">R$ 500,00</h2>
        <div className="flex flex-row text-small">
          <div className="w-3/4">
            <p>Limite</p>
            <p className="font-semibold">R$ 2.000</p>
          </div>
          <div className="w-1/4 text-right">
            <p>Venc.</p>
            <p className="font-semibold">06/03</p>
          </div>
        </div>
      </div>
    </div>
  );
}
