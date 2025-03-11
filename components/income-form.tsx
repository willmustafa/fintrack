"use client";

import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import { DatePicker } from "@heroui/date-picker";
import { getLocalTimeZone, now } from "@internationalized/date";
import { Select, SelectItem } from "@heroui/select";
import { Avatar } from "@heroui/avatar";
import { useDisclosure } from "@heroui/use-disclosure";

export const animals = [
  { key: "cat", label: "Cat" },
  { key: "dog", label: "Dog" },
  { key: "elephant", label: "Elephant" },
  { key: "lion", label: "Lion" },
  { key: "tiger", label: "Tiger" },
  { key: "giraffe", label: "Giraffe" },
  { key: "dolphin", label: "Dolphin" },
  { key: "penguin", label: "Penguin" },
  { key: "zebra", label: "Zebra" },
  { key: "shark", label: "Shark" },
  { key: "whale", label: "Whale" },
  { key: "otter", label: "Otter" },
  { key: "crocodile", label: "Crocodile" },
];

export default function IncomeForm() {
  const { isOpen, onOpenChange } = useDisclosure();

  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-8 flex-initial text-large font-semibold flex flex-col gap-1 bg-green-500 text-white">
        <h2 className="text-xl">Nova Receita</h2>
        <Input
          placeholder="00,00"
          type="number"
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">R$</span>
            </div>
          }
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 px-6 py-2 overflow-y-auto mt-3">
        <Input
          labelPlacement="outside"
          label="Descrição"
          placeholder="Ração para gato"
          variant="flat"
        />
        <DatePicker
          hideTimeZone
          showMonthAndYearPickers
          defaultValue={now(getLocalTimeZone())}
          label="Data"
          labelPlacement="outside"
        />
        <Select
          label="Conta / Cartão"
          labelPlacement="outside"
          placeholder="Selecione uma conta"
          classNames={{ base: "!mt-8" }}
          selectionMode="single"
          items={animals}
        >
          {(animals) => (
            <SelectItem
              key={animals.key}
              startContent={
                <Avatar
                  alt="Nubank"
                  className="w-6 h-6"
                  src="https://logodownload.org/wp-content/uploads/2019/08/nubank-logo-2-1.png"
                />
              }
            >
              {animals.label}
            </SelectItem>
          )}
        </Select>
        <Select
          label="Categoria"
          labelPlacement="outside"
          placeholder="Selecione uma categoria"
          classNames={{ base: "!mt-8" }}
          onOpenChange={onOpenChange}
          isOpen={isOpen}
        >
          <SelectItem
            key="nubank"
            startContent={
              <Avatar
                alt="Nubank"
                className="w-6 h-6"
                src="https://logodownload.org/wp-content/uploads/2019/08/nubank-logo-2-1.png"
              />
            }
          >
            Nubank
          </SelectItem>
        </Select>
      </div>
      <div className="flex flex-row gap-2 p-8 justify-between">
        <Button color="danger" variant="flat" size="lg">
          Cancelar
        </Button>
        <Button color="success" className="text-white" size="lg">
          Salvar
        </Button>
      </div>
    </div>
  );
}
