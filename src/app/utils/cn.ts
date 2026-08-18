import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Combines conditional classes and resolves Tailwind conflicts (design_system.md's components all use this instead of template strings). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
