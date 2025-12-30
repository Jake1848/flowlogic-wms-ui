import { useEffect, useState, useMemo } from 'react'
import { Activity } from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts'

interface DataPoint {
  time: string
  accuracy: number
  completion: number
}

// Generate initial data outside component for consistency
const generateInitialData = (): DataPoint[] => {
  const data: DataPoint[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60 * 1000)
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      accuracy: 95 + Math.random() * 4,
      completion: 70 + Math.random() * 20,
    })
  }
  return data
}

export default function ProductionGraph() {
  const [data, setData] = useState<DataPoint[]>(generateInitialData)

  // Update data every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) => {
        const newData = [...prevData]
        newData.shift() // Remove oldest
        newData.push({
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          accuracy: 95 + Math.random() * 4,
          completion: Math.min(100, newData[newData.length - 1].completion + Math.random() * 5),
        })
        return newData
      })
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  // Memoize tooltip style to avoid recreation on each render
  const tooltipStyle = useMemo(() => ({
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    padding: '12px 16px',
  }), [])

  // Get current average values
  const currentAccuracy = data.length > 0 ? data[data.length - 1].accuracy : 0
  const currentCompletion = data.length > 0 ? data[data.length - 1].completion : 0

  return (
    <section className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/50 dark:border-slate-800 shadow-lg" aria-label="Performance graph">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Real-time Performance
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Live inventory accuracy and audit completion rates
              </p>
            </div>
          </div>

          {/* Live stats badges */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {currentAccuracy.toFixed(1)}% Accuracy
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {currentCompletion.toFixed(1)}% Complete
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-gray-200 dark:text-slate-700"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                stroke="currentColor"
                className="text-gray-400 dark:text-slate-500"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="currentColor"
                className="text-gray-400 dark:text-slate-500"
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#1f2937', fontWeight: 600, marginBottom: 8 }}
                itemStyle={{ color: '#6b7280' }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingBottom: 20 }}
              />
              <Area
                type="monotone"
                dataKey="accuracy"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#accuracyGradient)"
                name="Inventory Accuracy %"
                dot={false}
                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="completion"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#completionGradient)"
                name="Audit Completion %"
                dot={false}
                activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
