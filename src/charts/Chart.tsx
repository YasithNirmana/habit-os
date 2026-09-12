import React from 'react';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { ChartSpec } from './series';

/** Renders a ChartSpec on screen. The PDF renders the same spec via toSvg. */
export function Chart({ spec }: { spec: ChartSpec }) {
  return (
    <Svg width={spec.width} height={spec.height}>
      {spec.prims.map((p, i) => {
        switch (p.t) {
          case 'rect':
            return (
              <Rect
                key={i}
                x={p.x}
                y={p.y}
                width={p.w}
                height={p.h}
                rx={p.rx ?? 0}
                fill={p.fill}
                opacity={p.opacity ?? 1}
              />
            );
          case 'line':
            return (
              <Line
                key={i}
                x1={p.x1}
                y1={p.y1}
                x2={p.x2}
                y2={p.y2}
                stroke={p.stroke}
                strokeWidth={p.width}
                strokeDasharray={p.dash}
              />
            );
          case 'path':
            return (
              <Path
                key={i}
                d={p.d}
                stroke={p.stroke ?? 'none'}
                strokeWidth={p.width ?? 1}
                fill={p.fill ?? 'none'}
                opacity={p.opacity ?? 1}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            );
          case 'circle':
            return <Circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} />;
          case 'text':
            return (
              <SvgText
                key={i}
                x={p.x}
                y={p.y}
                fill={p.fill}
                fontSize={p.size}
                fontWeight={p.weight ?? 400}
                textAnchor={p.anchor}
              >
                {p.text}
              </SvgText>
            );
        }
      })}
    </Svg>
  );
}
