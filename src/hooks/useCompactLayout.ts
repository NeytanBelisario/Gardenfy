import { useWindowDimensions } from 'react-native';

/** Largura lógica abaixo da qual as telas usam o modo compacto (celulares estreitos, ex.: 320/360 dp). */
export const COMPACT_BREAKPOINT = 380;

export function isCompactWidth(width: number, fontScale = 1): boolean {
  // Fonte ampliada ocupa o mesmo espaço que uma tela mais estreita.
  return width / Math.max(1, fontScale) < COMPACT_BREAKPOINT;
}

export function useCompactLayout(): boolean {
  const { width, fontScale } = useWindowDimensions();
  return isCompactWidth(width, fontScale);
}
