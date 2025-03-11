import { Button } from "@heroui/button";
import { Drawer, DrawerBody, DrawerContent } from "@heroui/drawer";
import { useDisclosure } from "@heroui/use-disclosure";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { useState } from "react";
import { PressEvent } from "@react-types/shared";
import IncomeForm from "@/components/income-form";

export default function InteractionButton() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedMenu, setSelectedMenu] = useState<
    "income" | "expense" | "transfer" | "investment" | null
  >();

  function openDrawer(e: PressEvent) {
    setSelectedMenu(e.target.getAttribute("data-key") as any);
    onOpen();
  }

  function toggleDrawer(...args: any[]) {
    console.log(args);
  }

  return (
    <>
      <Dropdown>
        <DropdownTrigger className="rounded-full fixed w-14 h-14 p-4 bottom-5 right-5 text-xl min-w-14 bg-[var(--dark-blue)] text-white">
          <Button>+</Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Static Actions">
          <DropdownItem key="income" onPress={openDrawer}>
            Nova Receita
          </DropdownItem>
          <DropdownItem key="expense" onPress={onOpen}>
            Nova Despesa
          </DropdownItem>
          <DropdownItem key="transfer" onPress={onOpen}>
            Nova Transferência
          </DropdownItem>
          <DropdownItem key="investment" onPress={onOpen}>
            Novo Investimento
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <Drawer isOpen={isOpen} onOpenChange={onOpenChange} hideCloseButton>
        <DrawerContent>
          {() => (
            <DrawerBody>
              {selectedMenu === "income" && <IncomeForm />}
            </DrawerBody>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
