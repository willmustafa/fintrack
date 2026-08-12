/**
 * Formatação pt-BR feita à mão para não depender do suporte a Intl do Hermes.
 */

const MONTHS_SHORT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

const groupThousands = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** `1234.5` → `1.234,50` */
export function formatNumber(value: number, decimals = 2): string {
  const fixed = Math.abs(value).toFixed(decimals);
  const [int, dec] = fixed.split('.');
  const body = groupThousands(int);
  return dec ? `${body},${dec}` : body;
}

/** `1234.5` → `R$ 1.234,50` */
export function formatCurrency(value: number, decimals = 2): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}R$ ${formatNumber(value, decimals)}`;
}

/** Versão compacta usada nos cards de resumo: `R$ 4.050` */
export function formatCurrencyShort(value: number): string {
  return formatCurrency(value, 0);
}

/** Valor com sinal explícito, como nas listas de transação. */
export function formatSigned(value: number, decimals = 2): string {
  if (value === 0) return formatCurrency(0, decimals);
  const sign = value > 0 ? '+' : '-';
  return `${sign}R$ ${formatNumber(value, decimals)}`;
}

export function formatPercent(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${formatNumber(Math.abs(value), decimals)}%`;
}

/** `2024-05-24` → `24/05` */
export function formatDayMonth(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

/** `2024-05-24` → `24/05/2024` */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

/** `2024-12` → `dez/24` */
export function formatMonthShort(isoMonth: string): string {
  const [year, month] = isoMonth.split('-');
  return `${MONTHS_SHORT[Number(month) - 1]}/${year.slice(2)}`;
}

/** `2024-12` → `dez/2024` */
export function formatMonthLong(isoMonth: string): string {
  const [year, month] = isoMonth.split('-');
  return `${MONTHS_SHORT[Number(month) - 1]}/${year}`;
}

/** `dez/2024` → `2024-12` (inverso de `formatMonthLong`); `null` se não reconhecer. */
export function parseMonthLong(label: string): string | null {
  const [month, year] = label.split('/').map((part) => part.trim());
  const index = MONTHS_SHORT.indexOf(month?.toLowerCase() ?? '');
  if (index < 0 || !/^\d{4}$/.test(year ?? '')) return null;
  return `${year}-${String(index + 1).padStart(2, '0')}`;
}

/** `238` → `19 anos e 10 meses`; abaixo de um ano fica só em meses. */
export function formatMonthSpan(months: number): string {
  if (months <= 0) return 'quitado';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const yearLabel = years === 1 ? '1 ano' : `${years} anos`;
  const monthLabel = rest === 1 ? '1 mês' : `${rest} meses`;
  if (years === 0) return monthLabel;
  if (rest === 0) return yearLabel;
  return `${yearLabel} e ${monthLabel}`;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/** `2024-05` → `Maio 2024` */
export function formatMonthTitle(isoMonth: string): string {
  const [year, month] = isoMonth.split('-');
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

export function monthNameOf(isoMonth: string): string {
  return MONTH_NAMES[Number(isoMonth.split('-')[1]) - 1];
}

/**
 * Cabeçalho de grupo da lista de transações: `HOJE · 24/05`, `ONTEM · 23/05`
 * ou apenas a data. `today` é injetado para manter a função pura/testável.
 */
export function dayGroupLabel(iso: string, today: string): string {
  const dayMs = 24 * 60 * 60 * 1000;
  const diff = Math.round((Date.parse(today) - Date.parse(iso)) / dayMs);
  if (diff === 0) return `HOJE · ${formatDayMonth(iso)}`;
  if (diff === 1) return `ONTEM · ${formatDayMonth(iso)}`;
  return formatDayMonth(iso);
}

/** Digitação de valor no teclado numérico: `15630` → `156,30` */
export function centsToInput(digits: string): string {
  const clean = digits.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  const padded = clean.padStart(3, '0');
  const cents = padded.slice(-2);
  const int = padded.slice(0, -2);
  return `${groupThousands(int)},${cents}`;
}

export function inputToNumber(input: string): number {
  const normalized = input.replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
