import { render, screen } from '@testing-library/react-native';

import { Donut, LineChart, MiniBars, PairedBars } from '@/components/charts';
import { colors } from '@/theme/tokens';

const styleOf = (node: { props: { style?: unknown } }) =>
  Object.assign({}, ...[node.props.style].flat(Infinity).filter(Boolean)) as Record<string, unknown>;

const alturas = () =>
  screen.container
    .queryAll((node) => typeof styleOf(node as never).height === 'number')
    .map((node) => styleOf(node as never).height as number);

describe('MiniBars', () => {
  it('a maior barra ocupa a altura toda', async () => {
    await render(<MiniBars values={[10, 20, 40]} height={32} />);
    expect(alturas()).toEqual([32, 8, 16, 32]);
  });

  it('destaca a última barra com a cor de realce', async () => {
    await render(<MiniBars values={[10, 40]} highlight="#ffffff" color="#aaaaaa" />);
    const cores = screen.container
      .queryAll((n) => typeof styleOf(n as never).backgroundColor === 'string')
      .map((n) => styleOf(n as never).backgroundColor);
    expect(cores).toEqual(['#aaaaaa', '#ffffff']);
  });

  it('valores zerados usam a altura mínima de 3', async () => {
    await render(<MiniBars values={[0, 0]} height={32} />);
    expect(alturas()).toEqual([32, 3, 3]);
  });

  it('lista vazia não quebra', async () => {
    await render(<MiniBars values={[]} />);
    expect(screen.root).not.toBeNull();
  });
});

describe('PairedBars', () => {
  const data = [
    { label: 'S1', income: 1400, expense: 900 },
    { label: 'S2', income: 1200, expense: 1100 },
  ];

  it('mostra um rótulo por semana', async () => {
    await render(<PairedBars data={data} />);
    expect(screen.getByText('S1')).toBeOnTheScreen();
    expect(screen.getByText('S2')).toBeOnTheScreen();
  });

  it('usa verde para receita e vermelho para gasto', async () => {
    await render(<PairedBars data={[data[0]]} />);
    const cores = screen.container
      .queryAll((n) => typeof styleOf(n as never).backgroundColor === 'string')
      .map((n) => styleOf(n as never).backgroundColor);
    expect(cores).toEqual([colors.income, colors.expense]);
  });

  it('escala pela maior barra do conjunto', async () => {
    await render(<PairedBars data={[{ label: 'S1', income: 100, expense: 50 }]} height={64} />);
    const barras = screen.container
      .queryAll((n) => styleOf(n as never).width === 8)
      .map((n) => styleOf(n as never).height);
    expect(barras).toEqual([64, 32]);
  });

  it('semana sem movimento usa a altura mínima', async () => {
    await render(<PairedBars data={[{ label: 'S1', income: 0, expense: 0 }]} />);
    const barras = screen.container
      .queryAll((n) => styleOf(n as never).width === 8)
      .map((n) => styleOf(n as never).height);
    expect(barras).toEqual([3, 3]);
  });

  it('lista vazia não quebra', async () => {
    await render(<PairedBars data={[]} />);
    expect(screen.root).not.toBeNull();
  });
});

describe('Donut', () => {
  const slices = [
    { value: 50, color: '#112233' },
    { value: 30, color: '#445566' },
    { value: 20, color: '#778899' },
  ];

  it('mostra o rótulo central', async () => {
    await render(<Donut slices={slices} centerTop="R$ 2.380" centerBottom="gasto" />);
    expect(screen.getByText('R$ 2.380')).toBeOnTheScreen();
    expect(screen.getByText('gasto')).toBeOnTheScreen();
  });

  it('sem centerTop não mostra o rótulo de baixo', async () => {
    await render(<Donut slices={slices} centerBottom="ignorado" />);
    expect(screen.queryByText('ignorado')).toBeNull();
  });

  it('centerTop sem centerBottom funciona', async () => {
    await render(<Donut slices={slices} centerTop="100%" />);
    expect(screen.getByText('100%')).toBeOnTheScreen();
  });

  it('desenha um arco por fatia', async () => {
    await render(<Donut slices={slices} />);
    expect(screen.container.queryAll((n) => n.props.strokeDasharray !== undefined)).toHaveLength(3);
  });

  it('fatias zeradas não dividem por zero', async () => {
    await render(<Donut slices={[{ value: 0, color: '#112233' }]} centerTop="0%" />);
    expect(screen.getByText('0%')).toBeOnTheScreen();
  });

  it('sem fatias não quebra', async () => {
    await render(<Donut slices={[]} />);
    expect(screen.root).not.toBeNull();
  });
});

describe('LineChart', () => {
  const values = [17200, 17900, 18400, 19300, 20100, 21340];

  it('desenha a linha e a área de preenchimento', async () => {
    await render(<LineChart values={values} />);
    const paths = screen.container.queryAll((n) => typeof n.props.d === 'string');
    expect(paths).toHaveLength(2);
    expect(paths[1].props.d.startsWith('M')).toBe(true);
  });

  it('sem preenchimento desenha só a linha', async () => {
    await render(<LineChart values={values} fill={false} />);
    expect(screen.container.queryAll((n) => typeof n.props.d === 'string')).toHaveLength(1);
  });

  it('mostra os rótulos quando informados', async () => {
    await render(<LineChart values={values} labels={['Dez', 'Mai']} />);
    expect(screen.getByText('Dez')).toBeOnTheScreen();
    expect(screen.getByText('Mai')).toBeOnTheScreen();
  });

  it('série plana não divide por zero', async () => {
    await render(<LineChart values={[100, 100, 100]} />);
    const linha = screen.container.queryAll((n) => typeof n.props.d === 'string')[1];
    expect(linha.props.d).not.toContain('NaN');
  });

  it('um ponto só não divide por zero', async () => {
    await render(<LineChart values={[42]} />);
    const linha = screen.container.queryAll((n) => typeof n.props.d === 'string')[1];
    expect(linha.props.d).not.toContain('NaN');
    expect(linha.props.d).not.toContain('Infinity');
  });

  it('aceita altura customizada', async () => {
    await render(<LineChart values={values} height={200} />);
    const svg = screen.container.queryAll((n) => n.props.vbHeight === 200);
    expect(svg.length).toBe(1);
  });
});
