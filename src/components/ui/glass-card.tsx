import * as React from 'react'
import { cn } from '../../lib/utils'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'bordered'
  hover?: boolean
  glow?: boolean
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', hover = false, glow = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'rounded-2xl backdrop-blur-xl transition-all duration-300',
          // Variant styles
          variant === 'default' && [
            'bg-white/10 dark:bg-white/5',
            'border border-white/20 dark:border-white/10',
            'shadow-glass',
          ],
          variant === 'gradient' && [
            'bg-gradient-to-br from-white/20 to-white/5',
            'border border-white/30 dark:border-white/10',
            'shadow-glass-lg',
          ],
          variant === 'bordered' && [
            'bg-white/5 dark:bg-white/[0.02]',
            'border-2 border-accent-purple/30',
            'shadow-neon',
          ],
          // Hover effect
          hover && 'hover:scale-[1.02] hover:shadow-glass-lg cursor-pointer',
          // Glow effect
          glow && 'animate-glow',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassCard.displayName = 'GlassCard'

const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
GlassCardHeader.displayName = 'GlassCardHeader'

const GlassCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      'bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent',
      className
    )}
    {...props}
  />
))
GlassCardTitle.displayName = 'GlassCardTitle'

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-white/60', className)}
    {...props}
  />
))
GlassCardDescription.displayName = 'GlassCardDescription'

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
GlassCardContent.displayName = 'GlassCardContent'

const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
GlassCardFooter.displayName = 'GlassCardFooter'

export {
  GlassCard,
  GlassCardHeader,
  GlassCardFooter,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent
}
