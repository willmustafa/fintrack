"use client";

import { motion } from "framer-motion";
import DashedCard from "@/components/dashed-card";
import BankCard from "@/components/bank-card";
import { Drawer, DrawerContent } from "@heroui/drawer";
import CardForm from "@/components/card-form";
import { useDisclosure } from "@heroui/use-disclosure";
import { useState } from "react";
import AccountForm from "@/components/account-form";

export default function DashboardPage() {
  const { isOpen, onOpenChange } = useDisclosure();
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      name: "Nubank",
      initial_balance: 100,
      balance: 500,
      predicted_balance: 16,
      balance_invested: 4,
      background:
        "https://st2.depositphotos.com/3367263/49914/i/450/depositphotos_499146702-stock-photo-image-multiple-geometric-shapes-circles.jpg",
    },
    {
      id: 2,
      name: "C6",
      initial_balance: 0,
      balance: 50000,
      predicted_balance: 16000,
      balance_invested: 4000,
      background:
        "https://img.freepik.com/vetores-gratis/fundo-preto-padrao-de-linhas-em-ziguezague_1017-37483.jpg?t=st=1745001388~exp=1745004988~hmac=a97b5753a29bcae698fe5293aa27fdbae534e72d77f3b9f0204fe1e8a940a67e&w=1060",
    },
  ]);
  const [selectedAccount, setSelectedAccount] = useState({});

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
          setSelectedAccount({});
          onOpenChange();
        }}
      >
        Nova Conta
      </DashedCard>
      {accounts.map((account) => (
        <BankCard
          name={account.name}
          balance={account.balance}
          predicted_balance={account.predicted_balance}
          balance_invested={account.balance_invested}
          background={account.background}
          onEditClick={() => {
            setSelectedAccount(account);
            onOpenChange();
          }}
        />
      ))}
      <Drawer isOpen={isOpen} onOpenChange={onOpenChange} hideCloseButton>
        <DrawerContent>
          <AccountForm payload={selectedAccount} />
        </DrawerContent>
      </Drawer>
    </motion.div>
  );
}
