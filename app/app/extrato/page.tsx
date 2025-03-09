"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { motion } from "framer-motion";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
} from "@tanstack/table-core";
import { useState } from "react";
import { flexRender, useReactTable } from "@tanstack/react-table";
import { Input } from "@heroui/input";
import {
  CheckCircleSolid,
  ClockSolid,
  EditPencil,
  Trash,
  Upload,
} from "iconoir-react";
import colors from "tailwindcss/colors";
import { toLocalDate } from "@/helpers/dates";
import clsx from "clsx";
import { toCurrency } from "@/helpers/numbers";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";

export default function ExtractPage() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedKeys, setSelectedKeys] = useState(new Set(["text"]));

  // Dados de exemplo
  const data = [
    {
      id: 1,
      status: "ok",
      date: "2024-03-08",
      description: "Assinatura Netflix",
      account: "Cartão Visa",
      value: 39.9,
    },
    {
      id: 2,
      status: "pending",
      date: "2024-03-07",
      description: "Compra no Mercado",
      account: "Conta Santander",
      value: -150.0,
    },
    {
      id: 3,
      status: "ok",
      date: "2024-03-06",
      description: "Fatura Cartão",
      account: "Cartão Mastercard",
      value: 1200.0,
    },
  ];

  // Definição das colunas
  const columns: ColumnDef<(typeof data)[number]>[] = [
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <>
          {row.original.status === "ok" && (
            <CheckCircleSolid color={colors.green["500"]} />
          )}
          {row.original.status === "pending" && (
            <ClockSolid color={colors.yellow["500"]} />
          )}
        </>
      ),
    },
    {
      accessorKey: "date",
      header: "Data",
      cell: ({ row }) => toLocalDate(row.original.date),
    },
    { accessorKey: "description", header: "Descrição" },
    { accessorKey: "account", header: "Conta" },
    {
      accessorKey: "value",
      header: "Valor",
      cell: ({ row }) => (
        <Input
          placeholder="0,00"
          startContent={
            <div className="pointer-events-none flex items-center">
              <span
                className={clsx(
                  "text-default-400 text-small",
                  row.original.value < 0 && "!text-red-500",
                )}
              >
                R$
              </span>
            </div>
          }
          type="text"
          classNames={{
            mainWrapper: "border-none",
            inputWrapper: "bg-transparent !border-none",
            input: clsx(row.original.value < 0 && "!text-red-500"),
          }}
          value={toCurrency(row.original.value, {
            style: "decimal",
            minimumFractionDigits: 2,
          })}
        />
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <span className="flex gap-2">
          <EditPencil />
          <Trash />
        </span>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { globalFilter },
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      return String(row.getValue(columnId))
        .toLowerCase()
        .includes(filterValue.toLowerCase());
    },
  });

  return (
    <motion.div
      className="w-full grid grid-cols-1 gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-none">
        <CardHeader>
          <h2 className="text-lg font-semibold w-2/3 text-left">Extrato</h2>
          <div className="w-1/3 flex items-center gap-3">
            <Input
              type="text"
              placeholder="Buscar..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full max-w-md"
            />
            <Upload />
          </div>
        </CardHeader>
        <CardBody>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-2 text-gray-600">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-2 text-center text-gray-500"
                  >
                    Nenhum resultado encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </motion.div>
  );
}
