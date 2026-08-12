/**
 * Bancos brasileiros mais comuns para o seletor de contas e cartões.
 * A cor é usada como `brandColor` do cartão (fundo do card na aba Cartões).
 * Quando o backend em Go existir, esta lista pode virar um endpoint — as telas
 * só dependem de `id`, `name` e `color`.
 */

export type Bank = {
  id: string;
  name: string;
  /** Cor da marca — vira o `brandColor` do cartão. */
  color: string;
};

export const banks: Bank[] = [
  { id: 'nubank', name: 'Nubank', color: '#8a05be' },
  { id: 'inter', name: 'Banco Inter', color: '#ff7a00' },
  { id: 'itau', name: 'Itaú', color: '#ec7000' },
  { id: 'bradesco', name: 'Bradesco', color: '#cc092f' },
  { id: 'bb', name: 'Banco do Brasil', color: '#0033a0' },
  { id: 'santander', name: 'Santander', color: '#ec0000' },
  { id: 'caixa', name: 'Caixa', color: '#1c5fab' },
  { id: 'c6', name: 'C6 Bank', color: '#242424' },
  { id: 'btg', name: 'BTG Pactual', color: '#00263a' },
  { id: 'sicoob', name: 'Sicoob', color: '#00553f' },
  { id: 'sicredi', name: 'Sicredi', color: '#3fa110' },
  { id: 'picpay', name: 'PicPay', color: '#21c25e' },
  { id: 'pagbank', name: 'PagBank', color: '#10a04f' },
  { id: 'neon', name: 'Neon', color: '#00b0f0' },
  { id: 'original', name: 'Banco Original', color: '#00a868' },
  { id: 'outro', name: 'Outro banco', color: '#6a6a70' },
];

export const findBank = (id?: string): Bank | undefined =>
  id ? banks.find((bank) => bank.id === id) : undefined;

/** Nome amigável do banco a partir do id salvo na conta. */
export const bankName = (id?: string): string | undefined => findBank(id)?.name;
