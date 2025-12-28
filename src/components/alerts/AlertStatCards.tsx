import { motion } from 'framer-motion'
import { AlertCircle, Brain, Activity, TrendingUp } from 'lucide-react'

interface AlertStatCardsProps {
  criticalCount: number
  anomalyCount: number
  patternCount: number
  anomalyRate: number
}

export function AlertStatCards({
  criticalCount,
  anomalyCount,
  patternCount,
  anomalyRate
}: AlertStatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Critical Alerts</p>
            <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">AI Anomalies</p>
            <p className="text-2xl font-bold text-purple-600">{anomalyCount}</p>
          </div>
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Patterns Found</p>
            <p className="text-2xl font-bold text-blue-600">{patternCount}</p>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Anomaly Rate</p>
            <p className="text-2xl font-bold text-orange-600">{anomalyRate.toFixed(1)}%</p>
          </div>
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <TrendingUp className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
