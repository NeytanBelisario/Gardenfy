export function formatPercent(value: number | null | undefined, unknownLabel = 'Sem análise') {
  return typeof value === 'number' ? `${value}%` : unknownLabel;
}
