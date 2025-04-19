import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { useState } from "react";

interface Props {
  payload?: any;
}

export default function AccountForm({ payload = {} }: Props) {
  const [name, setName] = useState(payload.name || "");
  const [initialBalance, setInitialBalance] = useState(
    payload.initial_balance || 0,
  );

  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-8 flex-initial text-large font-semibold flex flex-col gap-1">
        <h2 className="text-xl">{payload?.id ? "Editar" : "Criar"} Conta</h2>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-6 py-2 overflow-y-auto mt-3">
        <Input
          labelPlacement="outside"
          label="Nome"
          placeholder="Cartão Roxo"
          variant="flat"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          labelPlacement="outside"
          label="Saldo Inicial"
          placeholder="0,00"
          variant="flat"
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">R$</span>
            </div>
          }
          type="number"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
        />
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
