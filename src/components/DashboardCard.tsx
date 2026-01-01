import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { cn } from '../lib/utils'

// ============================================
// DASHBOARDCARD DEBUG LOGGING
// ============================================
console.log('%c[DashboardCard.tsx] Module loaded - WITH FRAMER-MOTION', 'color: #8b5cf6; font-weight: bold; font-size: 14px;')
console.log('%c[DashboardCard] motion import:', 'color: #3b82f6;', typeof motion !== 'undefined' ? 'LOADED' : 'FAILED')

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

const colorClasses = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
}

export default function DashboardCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  index = 0,
}: DashboardCardProps) {
  // DEBUG: Log each card render
  console.log('%c[DashboardCard] Rendering:', 'color: #ec4899;', { title, value, color, index })

  useEffect(() => {
    console.log('%c[DashboardCard] "' + title + '" MOUNTED with animation delay: ' + (index * 0.1) + 's', 'color: #10b981;')
    return () => console.log('%c[DashboardCard] "' + title + '" UNMOUNTED', 'color: #ef4444;')
  }, [title, index])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      onAnimationStart={() => console.log('%c[DashboardCard] Animation START: ' + title, 'color: #f59e0b;')}
      onAnimationComplete={() => console.log('%c[DashboardCard] Animation COMPLETE: ' + title, 'color: #10b981;')}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </CardTitle>
          <div className={cn("p-3 rounded-xl", colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </div>
          {trend && (
            <p className={cn(
              "text-xs mt-1 font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% vs last week
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
