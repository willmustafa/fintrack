import { Card, CardBody } from "@heroui/card";
import { ArrowsUpFromLine } from "lucide-react";

interface Props {}

export default function CompactCard({}: Props) {
  return (
    <Card>
      <CardBody className="flex-row gap-8">
        <ArrowsUpFromLine />
        Saldo
        <strong>R$ 500,00</strong>
      </CardBody>
    </Card>
  );
}
