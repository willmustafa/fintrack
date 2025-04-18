import CreditCard from "@/components/credit-card";
import { toCurrency } from "@/helpers/numbers";
import DashedCard from "@/components/dashed-card";
import { useState } from "react";

export default function CardSection() {
  const [cards, setCards] = useState([
    {
      id: 1,
      name: "Nubank",
      value: 500,
      limit: 2000,
      due_date: "06/03",
      background:
        "https://st2.depositphotos.com/3367263/49914/i/450/depositphotos_499146702-stock-photo-image-multiple-geometric-shapes-circles.jpg",
    },
    {
      id: 2,
      name: "C6",
      value: 800,
      limit: 2000,
      due_date: "16/03",
      background:
        "https://img.freepik.com/vetores-gratis/fundo-preto-padrao-de-linhas-em-ziguezague_1017-37483.jpg?t=st=1745001388~exp=1745004988~hmac=a97b5753a29bcae698fe5293aa27fdbae534e72d77f3b9f0204fe1e8a940a67e&w=1060",
    },
  ]);
  const [selectedCardId, setSelectedCardId] = useState(0);

  function nextCard() {
    if (cards.length - 1 > selectedCardId)
      setSelectedCardId(selectedCardId + 1);
    else setSelectedCardId(0);
  }

  return (
    <div>
      <h2 className="text-left mb-4 font-semibold text-lg">Cartões</h2>
      <div className="grid grid-cols-3 w-full gap-8">
        <CreditCard
          limit={cards[selectedCardId].limit}
          value={cards[selectedCardId].value}
          name={cards[selectedCardId].name}
          due_date={cards[selectedCardId].due_date}
          background={cards[selectedCardId].background}
          className="col-span-2"
          showArrow
          onChangeCard={nextCard}
        />
        <div className="flex flex-col">
          <div className="text-left mb-3">
            <h3>Faturas Abertas:</h3>
            <h2 className="text-lg font-semibold">
              {toCurrency(cards.reduce((acc, cur) => acc + cur.value, 0))}
            </h2>
          </div>
          <DashedCard className="min-h-24 h-full">Novo cartão</DashedCard>
        </div>
      </div>
    </div>
  );
}
