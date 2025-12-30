import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface DashboardCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  index?: number
}

const colorConfig = {
  blue: {
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    shadow: 'shadow-blue-500/25',
  },
  green: {
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    shadow: 'shadow-emerald-500/25',
  },
  red: {
    gradient: 'from-red-500 to-rose-500',
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    shadow: 'shadow-red-500/25',
  },
  yellow: {
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    shadow: 'shadow-amber-500/25',
  },
  purple: {
    gradient: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    shadow: 'shadow-purple-500/25',
  },
}

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  index = 0,
}: DashboardCardProps) {
  const config = colorConfig[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
      className="group"
    >
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/50 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Gradient accent line */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />

        {/* Background decoration */}
        <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${config.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />

        <div className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {title}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {value}
              </p>
              {trend && (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  trend.isPositive
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {trend.isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>{trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%</span>
                  <span className="text-gray-500 dark:text-slate-500 font-normal">vs last week</span>
                </div>
              )}
            </div>

            <div className={`p-4 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-lg ${config.shadow} group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
