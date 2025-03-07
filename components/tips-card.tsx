import { Card, CardBody } from "@heroui/card";
import Image, { StaticImageData } from "next/image";

export interface TipsCardProps {
  title: string;
  imageUrl: StaticImageData;
  message: string;
}

export default function TipsCard({ title, imageUrl, message }: TipsCardProps) {
  // @ts-ignore
  return (
    <Card className="bg-[#9086E9] text-white overflow-visible h-36">
      <CardBody className="flex flex-row overflow-visible min-h-32 content-center">
        <div className="w-1/4 relative">
          <Image
            className="absolute -bottom-[.75rem] left-4 w-5/6"
            alt=""
            src={imageUrl}
            width={100}
            height={100}
          />
        </div>
        <div className="w-3/4 self-center ps-5">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm mt-3">{message}</p>
        </div>
      </CardBody>
    </Card>
  );
}
