import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { GlassCard } from './glass-card'

export interface AIStatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down'
  }
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
  animated?: boolean
}

const variantStyles = {
  default: {
    gradient: 'from-blue-500/20 to-cyan-500/20',
    icon: 'text-blue-400',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]'
  },
  success: {
    gradient: 'from-emerald-500/20 to-green-500/20',
    icon: 'text-emerald-400',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]'
  },
  warning: {
    gradient: 'from-yellow-500/20 to-orange-500/20',
    icon: 'text-yellow-400',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]'
  },
  danger: {
    gradient: 'from-red-500/20 to-pink-500/20',
    icon: 'text-red-400',
    glow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]'
  },
  info: {
    gradient: 'from-purple-500/20 to-pink-500/20',
    icon: 'text-purple-400',
    glow: 'shadow-[0_0_15px_rgba(139,92,246,0.5)]'
  }
}

export function AIStatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className,
  animated = true
}: AIStatCardProps) {
  const styles = variantStyles[variant]
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <GlassCard
      variant="gradient"
      hover
      className={cn(
        'relative overflow-hidden group',
        animated && 'transition-all duration-500',
        isHovered && styles.glow,
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background gradient */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-500',
        styles.gradient,
        isHovered ? 'opacity-70' : 'opacity-50'
      )} />

      {/* Shimmer effect */}
      {animated && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
             style={{ backgroundSize: '200% 100%' }} />
      )}

      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <p className="text-sm font-medium text-white/70 uppercase tracking-wider">
              {title}
            </p>
            <p className={cn(
              'text-4xl font-bold text-white transition-all duration-300',
              animated && isHovered && 'scale-105'
            )}>
              {value}
            </p>
            {trend && (
              <div className={cn(
                'flex items-center gap-2 text-sm font-medium',
                trend.direction === 'up' ? 'text-emerald-400' : 'text-red-400'
              )}>
                {trend.direction === 'up' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-white/50">{trend.label}</span>
              </div>
            )}
          </div>

          {/* Animated icon */}
          <div className={cn(
            'p-4 rounded-2xl bg-white/10 backdrop-blur-sm transition-all duration-500',
            animated && isHovered && 'scale-110 rotate-12',
            styles.icon
          )}>
            <Icon className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r transition-opacity duration-500',
        styles.gradient,
        isHovered ? 'opacity-100' : 'opacity-0'
      )} />
    </GlassCard>
  )
}
