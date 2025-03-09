import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@heroui/drawer";
import { useDisclosure } from "@heroui/use-disclosure";
import { Checkbox } from "@heroui/checkbox";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { useState } from "react";
import { PressEvent } from "@react-types/shared";

export default function InteractionButton() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedMenu, setSelectedMenu] = useState<
    "income" | "expense" | "transfer" | "investment" | null
  >();

  function openDrawer(e: PressEvent) {
    setSelectedMenu(e.target.getAttribute("data-key") as any);
    onOpen();
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
      <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="flex flex-col gap-1 bg-green-500">
                <h2>Nova Receita</h2>
                <Input
                  placeholder="00,00"
                  type="number"
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">R$</span>
                    </div>
                  }
                />
              </DrawerHeader>
              <DrawerBody className="mt-3">
                <Input
                  labelPlacement="outside"
                  label="Email"
                  placeholder="Enter your email"
                  variant="bordered"
                />
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  type="password"
                  variant="bordered"
                />
                <div className="flex py-2 px-1 justify-between">
                  <Checkbox
                    classNames={{
                      label: "text-small",
                    }}
                  >
                    Remember me
                  </Checkbox>
                  <Link color="primary" href="#" size="sm">
                    Forgot password?
                  </Link>
                </div>
              </DrawerBody>
              <DrawerFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={onClose}>
                  Sign in
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
}
