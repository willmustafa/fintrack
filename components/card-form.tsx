import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { useState } from "react";

interface Props {
  payload?: any;
}

export default function CardForm({ payload = {} }: Props) {
  const [name, setName] = useState(payload.name || "");
  const [limit, setLimit] = useState(payload.limit || 0);
  const [dueDate, setDueDate] = useState<Set<string>>(
    new Set(payload.due_date ? [payload.due_date.toString()] : []),
  );
  const [closingDate, setClosingDate] = useState<Set<string>>(
    new Set(payload.closing_date ? [payload.closing_date.toString()] : []),
  );
  const days = Array.from({ length: 31 }, (acc, i) => ({
    key: (i + 1).toString(),
    value: (i + 1).toString(),
  }));

  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-8 flex-initial text-large font-semibold flex flex-col gap-1">
        <h2 className="text-xl">{payload?.id ? "Editar" : "Criar"} Cartão</h2>
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
          label="Limite"
          placeholder="2.000,00"
          variant="flat"
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">R$</span>
            </div>
          }
          type="number"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />
        <Select
          label="Vencimento"
          labelPlacement="outside"
          placeholder="Data que precisa pagar"
          selectionMode="single"
          items={days}
          selectedKeys={dueDate}
          onSelectionChange={setDueDate}
        >
          {(el) => <SelectItem>{el.value}</SelectItem>}
        </Select>
        <Select
          label="Fechamento"
          labelPlacement="outside"
          placeholder="Data que finaliza a fatura"
          selectionMode="single"
          items={days}
          selectedKeys={closingDate}
          onSelectionChange={setDueDate}
        >
          {(el) => <SelectItem>{el.value}</SelectItem>}
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
