import { Card, CardBody, CardHeader } from "@heroui/card";
import Image from "next/image";

interface Props {
  title: string;
  description: string;
  image: string;
}

export default function HowItWorksCard({ title, description, image }: Props) {
  return (
    <Card className="border-0 rounded-2xl bg-blue-50 mb-14 pt-12 px-4 pb-8 md:inline-block align-top w-[300px]">
      <CardHeader className="mb-1 justify-center">
        <Image src={image} alt="" width={50} height={50} />
      </CardHeader>
      <CardBody className="text-center">
        <h5 className="font-semibold">{title}</h5>
        <p className="mb-4">{description}</p>
      </CardBody>
    </Card>
  );
}
