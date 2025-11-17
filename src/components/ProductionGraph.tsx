import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface DataPoint {
  time: string
  accuracy: number
  completion: number
}

export default function ProductionGraph() {
  const [data, setData] = useState<DataPoint[]>([])

  useEffect(() => {
    // Initialize with some data
    const initialData: DataPoint[] = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 5 * 60 * 1000)
      initialData.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        accuracy: 95 + Math.random() * 4,
        completion: 70 + Math.random() * 20,
      })
    }
    setData(initialData)

    // Update data every 15 seconds
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Real-time Performance
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Live inventory accuracy and audit completion rates
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="time"
            className="text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            className="text-gray-600 dark:text-gray-400"
            tick={{ fontSize: 12 }}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Inventory Accuracy %"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="completion"
            stroke="#10b981"
            strokeWidth={2}
            name="Audit Completion %"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
