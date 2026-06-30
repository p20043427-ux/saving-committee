// Design tokens — mirrors index.css @theme values
// Use these in TypeScript/JS for programmatic access (charts, dynamic styles)

export const colors = {
  primary: {
    50:  '#eef2fb',
    100: '#d5e0f5',
    200: '#aac1eb',
    300: '#7fa2e1',
    400: '#5483d7',
    500: '#2964cd',
    600: '#1b4ea3',
    700: '#1b3f8b',
    800: '#14306a',
    900: '#0d2050',
    950: '#08112e',
  },
  accent: {
    50:  '#e8f8f6',
    100: '#c2edea',
    200: '#86dbd4',
    300: '#4ac9bf',
    400: '#2aafa0',
    500: '#228f83',
    600: '#1a6f66',
    700: '#135049',
    800: '#0c3430',
    900: '#061a18',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    danger:  '#ef4444',
    info:    '#3b82f6',
  },
} as const;

export const radius = {
  sm:  '4px',
  md:  '8px',
  lg:  '12px',
  xl:  '16px',
  full: '9999px',
} as const;

export const shadow = {
  sm:  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md:  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg:  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
} as const;

export const fontSize = {
  xs:   '0.75rem',
  sm:   '0.875rem',
  base: '1rem',
  lg:   '1.125rem',
  xl:   '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
} as const;

// Semantic aliases — use these in components
export const token = {
  colorPrimary:  colors.primary[900],
  colorAccent:   colors.accent[500],
  colorSuccess:  colors.status.success,
  colorWarning:  colors.status.warning,
  colorDanger:   colors.status.danger,
  colorInfo:     colors.status.info,
  radiusSm:      radius.sm,
  radiusMd:      radius.md,
  radiusLg:      radius.lg,
} as const;
