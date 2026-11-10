/**
 * Design tokens do Gardenfy (1.3.0). Mesma identidade visual de antes, agora num lugar só:
 * novas telas usam estes nomes em vez de valores soltos.
 */
export const colors = {
  /** Verde-escuro da marca: títulos, botões principais, hero. */
  ink: '#17361d',
  /** Texto secundário e legendas. */
  text: '#586653',
  textSoft: '#6b7666',
  textLead: '#33452f',
  /** Verde de ações secundárias e ícones. */
  accent: '#476644',
  accentStrong: '#2f6b2a',
  background: '#fbf9f5',
  surface: '#ffffff',
  surfaceMuted: '#eef2e8',
  surfaceSoft: '#f1f3ec',
  surfaceWarm: '#f5f3ef',
  surfaceWarmHigh: '#eae8e4',
  border: '#e7e9e0',
  borderStrong: '#c2c8bf',
  danger: '#93000a',
  dangerTint: '#ffdad6',
  water: '#2f6f8f',
  waterTint: '#e2eff6',
  sun: '#9a6700',
  sunTint: '#fdf3d7',
  leafTint: '#e6f0e1',
  ai: '#5b3f86',
  aiTint: '#efe8f7',
  onInk: '#ffffff',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

export const radius = { sm: 12, md: 16, lg: 20, xl: 24, pill: 999 } as const;

export const font = {
  caption: 13,
  body: 15,
  lead: 16,
  title: 22,
  display: 32,
} as const;

/** Alvo mínimo de toque recomendado pelo Android (48 dp). */
export const minTouch = 48;
