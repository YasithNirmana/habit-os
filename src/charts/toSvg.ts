import type { ChartSpec } from './series';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The same ChartSpec as standalone SVG markup, for embedding in the PDF. */
export function toSvg(spec: ChartSpec): string {
  const body = spec.prims
    .map((p) => {
      switch (p.t) {
        case 'rect':
          return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.rx ?? 0}" fill="${p.fill}" opacity="${p.opacity ?? 1}"/>`;
        case 'line':
          return `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" stroke="${p.stroke}" stroke-width="${p.width}"${p.dash ? ` stroke-dasharray="${p.dash}"` : ''}/>`;
        case 'path':
          return `<path d="${p.d}" stroke="${p.stroke ?? 'none'}" stroke-width="${p.width ?? 1}" fill="${p.fill ?? 'none'}" opacity="${p.opacity ?? 1}" stroke-linejoin="round" stroke-linecap="round"/>`;
        case 'circle':
          return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${p.fill}"/>`;
        case 'text':
          return `<text x="${p.x}" y="${p.y}" fill="${p.fill}" font-size="${p.size}" font-weight="${p.weight ?? 400}" text-anchor="${p.anchor}" font-family="Helvetica, Arial, sans-serif">${esc(p.text)}</text>`;
      }
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}" viewBox="0 0 ${spec.width} ${spec.height}">${body}</svg>`;
}
