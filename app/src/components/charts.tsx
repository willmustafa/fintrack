import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Text } from '@/components/text';
import { colors } from '@/theme/tokens';

/** Barras verticais dentro do card de saldo (feitas com Views simples). */
export function MiniBars({
  values,
  height = 32,
  color = 'rgba(255,255,255,0.32)',
  highlight = colors.white,
}: {
  values: number[];
  height?: number;
  color?: string;
  highlight?: string;
}) {
  const max = Math.max(...values, 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height }}>
      {values.map((value, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height: Math.max((value / max) * height, 3),
            borderRadius: 2,
            backgroundColor: index === values.length - 1 ? highlight : color,
          }}
        />
      ))}
    </View>
  );
}

/** Receitas × gastos, um par de barras por semana. */
export function PairedBars({
  data,
  height = 64,
}: {
  data: { label: string; income: number; expense: number }[];
  height?: number;
}) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 10 }}>
        {data.map((item) => (
          <View
            key={item.label}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: 3,
              height: '100%',
            }}>
            <View
              style={{
                width: 8,
                height: Math.max((item.income / max) * height, 3),
                borderRadius: 2,
                backgroundColor: colors.income,
              }}
            />
            <View
              style={{
                width: 8,
                height: Math.max((item.expense / max) * height, 3),
                borderRadius: 2,
                backgroundColor: colors.expense,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', marginTop: 7, gap: 10 }}>
        {data.map((item) => (
          <Text key={item.label} size="micro" color={colors.textMuted} align="center" style={{ flex: 1 }}>
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

type DonutSlice = { value: number; color: string };

/** Rosca do 50/30/20 com rótulo central. */
export function Donut({
  slices,
  size = 104,
  thickness = 18,
  centerTop,
  centerBottom,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerTop?: string;
  centerBottom?: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {slices.map((slice, index) => {
          const length = (slice.value / total) * circumference;
          const dash = `${length} ${circumference - length}`;
          const element = (
            <Circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={slice.color}
              strokeWidth={thickness}
              fill="none"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              // Começa no topo, como no wireframe
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += length;
          return element;
        })}
      </Svg>
      {centerTop ? (
        <View style={{ alignItems: 'center' }}>
          <Text weight="extrabold" size="body">
            {centerTop}
          </Text>
          {centerBottom ? (
            <Text size="micro" color={colors.textSecondary}>
              {centerBottom}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function buildPath(values: number[], width: number, height: number, padding = 4) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const stepX = (width - padding * 2) / Math.max(values.length - 1, 1);
  return values
    .map((value, index) => {
      const x = padding + index * stepX;
      const y = padding + (1 - (value - min) / span) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

/** Linha de evolução (patrimônio investido, saldo devedor do financiamento). */
export function LineChart({
  values,
  labels,
  height = 110,
  color = colors.accent,
  fill = true,
}: {
  values: number[];
  labels?: string[];
  height?: number;
  color?: string;
  fill?: boolean;
}) {
  const width = 320;
  const path = buildPath(values, width, height);
  const areaPath = `${path} L${width - 4} ${height} L4 ${height} Z`;

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.22" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {fill ? <Path d={areaPath} fill="url(#lineFill)" /> : null}
        <Path d={path} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      </Svg>
      {labels ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          {labels.map((label) => (
            <Text key={label} size="micro" color={colors.textMuted}>
              {label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
