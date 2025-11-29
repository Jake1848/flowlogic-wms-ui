interface SparklineProps {
  data: number[]
  color: string
}

export default function Sparkline({ data, color }: SparklineProps) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 100}`)
    .join(' ')

  return (
    <svg viewBox="0 0 100 100" className="w-16 h-8" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="3" points={points} />
    </svg>
  )
}
