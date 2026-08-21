export type Tone =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'destructive'

export interface ToneClasses {
  soft: string
  solid: string
  text: string
  dot: string
}

export const TONE: Record<Tone, ToneClasses> = {
  primary: {
    soft: 'bg-primary/10 text-primary',
    solid: 'bg-primary text-primary-foreground',
    text: 'text-primary',
    dot: 'bg-primary',
  },
  secondary: {
    soft: 'bg-secondary text-secondary-foreground',
    solid: 'bg-secondary text-secondary-foreground',
    text: 'text-secondary-foreground',
    dot: 'bg-secondary-foreground',
  },
  neutral: {
    soft: 'bg-muted text-muted-foreground',
    solid: 'bg-muted text-foreground',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground/50',
  },
  info: {
    soft: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400',
    solid: 'bg-info text-info-foreground',
    text: 'text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500',
  },
  success: {
    soft: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    solid: 'bg-success text-success-foreground',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  warning: {
    soft: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    solid: 'bg-warning text-warning-foreground',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  destructive: {
    soft: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
    solid: 'bg-destructive text-white',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
}

export function toneClass(
  tone: Tone,
  intensity: keyof ToneClasses = 'soft'
): string {
  return TONE[tone][intensity]
}
