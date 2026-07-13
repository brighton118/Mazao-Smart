interface MoistureGaugeProps {
  value: number
  size?: number
}

function gaugeColor(v: number): string {
  if (v < 30) return '#e05a4e'
  if (v < 50) return '#e8a042'
  return '#4caf7d'
}

export default function MoistureGauge({ value, size = 80 }: MoistureGaugeProps) {
  const radius = (size / 2) * 0.78
  const circumference = 2 * Math.PI * radius
  const arcLength = circumference * 0.75
  const offset = arcLength * (1 - Math.min(100, Math.max(0, value)) / 100)
  const color = gaugeColor(value)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(135deg)' }}>
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke="rgba(245,239,230,0.08)"
        strokeWidth={size * 0.085}
        strokeDasharray={`${arcLength} ${circumference - arcLength}`}
        strokeLinecap="round"
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={size * 0.085}
        strokeDasharray={`${Math.max(0, arcLength - offset)} ${circumference - Math.max(0, arcLength - offset)}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.5s ease' }}
      />
    </svg>
  )
}
