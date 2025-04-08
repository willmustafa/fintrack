"use client";

import { motion } from "framer-motion";
import { Card, CardBody } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Tab, Tabs } from "@heroui/tabs";
import { Input } from "@heroui/input";

export default function DashboardPage() {
  return (
    <motion.div
      className="w-full grid grid-cols-1 gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="">
        <div className="absolute h-20 w-full bg-purple-700 z-0">
          <div className="w-full text-center flex justify-center flex-col items-center absolute -bottom-24">
            <Avatar
              src="https://www.tubefilter.com/wp-content/uploads/2018/09/anna-akana-1400x825.jpg"
              className="w-24 h-24"
            />
            <h3>Thaila Naga</h3>
            <p>Plano gratúito</p>
          </div>
        </div>
        <CardBody className="relative h-full">
          <Tabs className="mt-48">
            <Tab key="geral" title="Geral">
              <div>
                <Input label="Nome" />
              </div>
            </Tab>
            <Tab key="pass" title="Senha"></Tab>
            <Tab key="plan" title="Plano"></Tab>
          </Tabs>
        </CardBody>
      </Card>
    </motion.div>
  );
}
