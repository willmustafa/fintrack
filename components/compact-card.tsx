import { Card, CardBody } from "@heroui/card";
import { PropsWithChildren } from "react";
import { toCurrency } from "@/helpers/numbers";

interface Props extends PropsWithChildren {
  title: string;
  value: number;
}

export default function CompactCard({ title, value, children }: Props) {
  return (
    <Card className="bg-white shadow-none">
      <CardBody className="flex-row gap-8 text-sm items-center px-5 py-3 justify-between">
        {children}
        {title}
        <strong className="text-semibold">{toCurrency(value)}</strong>
      </CardBody>
    </Card>
  );
}
