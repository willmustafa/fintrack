import {
  centsToInput,
  dayGroupLabel,
  formatCurrency,
  formatCurrencyShort,
  formatDate,
  formatDayMonth,
  formatMonthLong,
  formatMonthSpan,
  formatMonthShort,
  formatMonthTitle,
  formatNumber,
  formatPercent,
  formatSigned,
  inputToNumber,
  monthNameOf,
  parseMonthLong,
  recentDateOptions,
} from '@/lib/format';

describe('formatNumber', () => {
  it.each([
    [0, '0,00'],
    [1, '1,00'],
    [1234.5, '1.234,50'],
    [1000000, '1.000.000,00'],
    [999.999, '1.000,00'],
    [0.005, '0,01'],
  ])('formata %p como %p', (input, expected) => {
    expect(formatNumber(input)).toBe(expected);
  });

  it('usa o valor absoluto — o sinal é responsabilidade de quem chama', () => {
    expect(formatNumber(-1234.5)).toBe('1.234,50');
  });

  it('respeita a quantidade de casas decimais', () => {
    expect(formatNumber(1234.567, 0)).toBe('1.235');
    expect(formatNumber(1234.567, 1)).toBe('1.234,6');
    expect(formatNumber(1234.5, 3)).toBe('1.234,500');
  });
});

describe('formatCurrency', () => {
  it('prefixa R$ e usa vírgula decimal', () => {
    expect(formatCurrency(156.3)).toBe('R$ 156,30');
    expect(formatCurrency(4050)).toBe('R$ 4.050,00');
  });

  it('coloca o sinal negativo antes do R$', () => {
    expect(formatCurrency(-830)).toBe('-R$ 830,00');
  });

  it('trata zero sem sinal', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });

  it('formatCurrencyShort omite os centavos', () => {
    expect(formatCurrencyShort(4050.9)).toBe('R$ 4.051');
    expect(formatCurrencyShort(-100)).toBe('-R$ 100');
  });
});

describe('formatSigned', () => {
  it('usa + para entradas e - para saídas', () => {
    expect(formatSigned(4200)).toBe('+R$ 4.200,00');
    expect(formatSigned(-156.3)).toBe('-R$ 156,30');
  });

  it('zero sai sem sinal', () => {
    expect(formatSigned(0)).toBe('R$ 0,00');
  });

  it('respeita as casas decimais', () => {
    expect(formatSigned(1500, 0)).toBe('+R$ 1.500');
  });
});

describe('formatPercent', () => {
  it.each([
    [8, '+8,0%'],
    [-3.25, '-3,3%'],
    [0, '0,0%'],
  ])('formata %p como %p', (input, expected) => {
    expect(formatPercent(input)).toBe(expected);
  });

  it('respeita as casas decimais', () => {
    expect(formatPercent(12.345, 2)).toBe('+12,35%');
    expect(formatPercent(12.345, 0)).toBe('+12%');
  });
});

describe('datas', () => {
  it('formatDayMonth devolve dd/MM', () => {
    expect(formatDayMonth('2024-05-24')).toBe('24/05');
  });

  it('formatDate devolve dd/MM/yyyy', () => {
    expect(formatDate('2024-05-24')).toBe('24/05/2024');
  });

  it('formatMonthShort abrevia mês e ano', () => {
    expect(formatMonthShort('2024-12')).toBe('dez/24');
    expect(formatMonthShort('2024-01')).toBe('jan/24');
  });

  it('formatMonthLong mantém o ano completo', () => {
    expect(formatMonthLong('2024-08')).toBe('ago/2024');
  });

  it('formatMonthTitle escreve o mês por extenso', () => {
    expect(formatMonthTitle('2024-05')).toBe('Maio 2024');
    expect(formatMonthTitle('2024-03')).toBe('Março 2024');
  });

  it('monthNameOf extrai o nome do mês de um YYYY-MM', () => {
    expect(monthNameOf('2024-05')).toBe('Maio');
    expect(monthNameOf('2024-12')).toBe('Dezembro');
  });

  it('cobre os doze meses', () => {
    const nomes = Array.from({ length: 12 }, (_, i) =>
      monthNameOf(`2024-${String(i + 1).padStart(2, '0')}`),
    );
    expect(nomes).toEqual([
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
    ]);
  });
});

describe('dayGroupLabel', () => {
  const hoje = '2024-05-24';

  it('marca o próprio dia como HOJE', () => {
    expect(dayGroupLabel('2024-05-24', hoje)).toBe('HOJE · 24/05');
  });

  it('marca o dia anterior como ONTEM', () => {
    expect(dayGroupLabel('2024-05-23', hoje)).toBe('ONTEM · 23/05');
  });

  it('dias mais antigos mostram só a data', () => {
    expect(dayGroupLabel('2024-05-20', hoje)).toBe('20/05');
  });

  it('datas futuras também caem no formato simples', () => {
    expect(dayGroupLabel('2024-05-25', hoje)).toBe('25/05');
  });

  it('funciona atravessando a virada de mês', () => {
    expect(dayGroupLabel('2024-04-30', '2024-05-01')).toBe('ONTEM · 30/04');
  });
});

describe('centsToInput', () => {
  it.each([
    ['', '0,00'],
    ['0', '0,00'],
    ['5', '0,05'],
    ['56', '0,56'],
    ['156', '1,56'],
    ['15630', '156,30'],
    ['123456789', '1.234.567,89'],
  ])('digitação %p vira %p', (input, expected) => {
    expect(centsToInput(input)).toBe(expected);
  });

  it('ignora caracteres não numéricos', () => {
    expect(centsToInput('R$ 1a5b6,30')).toBe('156,30');
  });

  it('remove zeros à esquerda', () => {
    expect(centsToInput('000015630')).toBe('156,30');
  });
});

describe('inputToNumber', () => {
  it.each([
    ['156,30', 156.3],
    ['1.234,50', 1234.5],
    ['0,00', 0],
    ['1.000.000,00', 1000000],
  ])('%p vira %p', (input, expected) => {
    expect(inputToNumber(input)).toBe(expected);
  });

  it('devolve 0 para entrada inválida', () => {
    expect(inputToNumber('abc')).toBe(0);
    expect(inputToNumber('')).toBe(0);
  });

  it('é o inverso de centsToInput', () => {
    expect(inputToNumber(centsToInput('15630'))).toBe(156.3);
  });
});

describe('parseMonthLong', () => {
  it('é o inverso de formatMonthLong', () => {
    expect(parseMonthLong('ago/2024')).toBe('2024-08');
    expect(parseMonthLong(formatMonthLong('2044-03'))).toBe('2044-03');
  });

  it('lê todos os meses do ano', () => {
    expect(parseMonthLong('jan/2024')).toBe('2024-01');
    expect(parseMonthLong('dez/2024')).toBe('2024-12');
  });

  it('ignora espaços e maiúsculas', () => {
    expect(parseMonthLong(' MAR/2044 ')).toBe('2044-03');
  });

  it('devolve null quando não reconhece', () => {
    expect(parseMonthLong('xxx/2024')).toBeNull();
    expect(parseMonthLong('mar/44')).toBeNull();
    expect(parseMonthLong('qualquer coisa')).toBeNull();
    expect(parseMonthLong('')).toBeNull();
  });
});

describe('formatMonthSpan', () => {
  it('menos de um ano fica só em meses', () => {
    expect(formatMonthSpan(5)).toBe('5 meses');
    expect(formatMonthSpan(1)).toBe('1 mês');
  });

  it('ano cheio não mostra os meses', () => {
    expect(formatMonthSpan(12)).toBe('1 ano');
    expect(formatMonthSpan(24)).toBe('2 anos');
  });

  it('combina anos e meses', () => {
    expect(formatMonthSpan(238)).toBe('19 anos e 10 meses');
    expect(formatMonthSpan(13)).toBe('1 ano e 1 mês');
  });

  it('zero ou negativo é quitado', () => {
    expect(formatMonthSpan(0)).toBe('quitado');
    expect(formatMonthSpan(-3)).toBe('quitado');
  });
});

describe('recentDateOptions', () => {
  it('começa em Hoje e Ontem, com a data completa como apoio', () => {
    const [hoje, ontem] = recentDateOptions('2024-05-24');
    expect(hoje).toEqual({ value: '2024-05-24', label: 'Hoje', hint: '24/05/2024' });
    expect(ontem).toEqual({ value: '2024-05-23', label: 'Ontem', hint: '23/05/2024' });
  });

  it('do terceiro dia em diante mostra só a data', () => {
    expect(recentDateOptions('2024-05-24')[2]).toEqual({
      value: '2024-05-22',
      label: '22/05/2024',
      hint: undefined,
    });
  });

  it('devolve duas semanas por padrão e volta o mês quando precisa', () => {
    const opcoes = recentDateOptions('2024-05-02');
    expect(opcoes).toHaveLength(14);
    expect(opcoes.at(-1)?.value).toBe('2024-04-19');
  });

  it('aceita outra quantidade de dias', () => {
    expect(recentDateOptions('2024-05-24', 3).map((o) => o.value)).toEqual([
      '2024-05-24',
      '2024-05-23',
      '2024-05-22',
    ]);
  });
});
