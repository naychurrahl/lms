import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils/cn'

/**
 * design_system.md's four variants. Exactly one `primary` button per
 * screen/panel is the convention — this component doesn't enforce that,
 * screens do.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:opacity-90',
        secondary: 'border border-border bg-surface text-text-primary hover:bg-bg',
        ghost: 'bg-transparent text-text-primary hover:bg-surface',
        destructive: 'bg-danger text-white hover:opacity-90',
      },
    },
    defaultVariants: { variant: 'primary' },
  }
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, ...props },
  ref
) {
  return <button ref={ref} className={cn(buttonVariants({ variant }), className)} {...props} />
})
