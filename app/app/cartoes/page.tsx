"use client";

import { motion } from "framer-motion";
import DashedCard from "@/components/dashed-card";
import CreditCard from "@/components/credit-card";
import { Drawer, DrawerContent } from "@heroui/drawer";
import CardForm from "@/components/card-form";
import { useDisclosure } from "@heroui/use-disclosure";
import { useState } from "react";

export default function DashboardPage() {
  const { isOpen, onOpenChange } = useDisclosure();
  const [cards, setCards] = useState([
    {
      id: 1,
      name: "Nubank",
      value: 500,
      limit: 2000,
      due_date: 16,
      closing_date: 4,
      background:
        "https://st2.depositphotos.com/3367263/49914/i/450/depositphotos_499146702-stock-photo-image-multiple-geometric-shapes-circles.jpg",
    },
    {
      id: 2,
      name: "C6",
      value: 800,
      limit: 2000,
      due_date: 10,
      closing_date: 1,
      background:
        "https://img.freepik.com/vetores-gratis/fundo-preto-padrao-de-linhas-em-ziguezague_1017-37483.jpg?t=st=1745001388~exp=1745004988~hmac=a97b5753a29bcae698fe5293aa27fdbae534e72d77f3b9f0204fe1e8a940a67e&w=1060",
    },
  ]);
  const [selectedCard, setSelectedCard] = useState({});

  return (
    <motion.div
      className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <DashedCard
        className="min-h-44 h-full"
        onClick={() => {
          setSelectedCard({});
          onOpenChange();
        }}
      >
        Novo cartão
      </DashedCard>
      {cards.map((card) => (
        <CreditCard
          limit={card.limit}
          value={card.value}
          name={card.name}
          due_date={card.due_date}
          background={card.background}
          showEdit
          key={card.id}
          onEditClick={() => {
            setSelectedCard(card);
            onOpenChange();
          }}
        />
      ))}
      <Drawer isOpen={isOpen} onOpenChange={onOpenChange} hideCloseButton>
        <DrawerContent>
          <CardForm payload={selectedCard} />
        </DrawerContent>
      </Drawer>
    </motion.div>
  );
}
