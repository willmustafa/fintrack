import { NumberFormatOptions } from "@internationalized/number";

export function toCurrency(value: number, opts?: NumberFormatOptions): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    ...opts,
  }).format(value);
}
