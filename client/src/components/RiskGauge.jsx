import React from 'react'

/**
 * SVG arc-based risk gauge.
 * score: 0-1
 */
export default function RiskGauge({ score = 0, size = 200 }) {
  const clamped = Math.min(Math.max(score, 0), 1)
  const color = clamped < 0.3 ? '#22c55e' : clamped <= 0.6 ? '#f59e0b' : '#ef4444'
  const level = clamped < 0.3 ? 'Low' : clamped <= 0.6 ? 'Medium' : 'High'

  // Arc geometry
  const cx = size / 2
  const cy = size * 0.55
  const r = size * 0.4
  const startAngle = Math.PI          // 180°
  const endAngle = 0                  // 0°
  const sweepAngle = startAngle - (startAngle - endAngle) * clamped

  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy - r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(sweepAngle)
  const y2 = cy - r * Math.sin(sweepAngle)
  const largeArc = clamped > 0.5 ? 1 : 0

  // Background arc (full semicircle)
  const bx1 = cx + r * Math.cos(startAngle)
  const by1 = cy - r * Math.sin(startAngle)
  const bx2 = cx + r * Math.cos(endAngle)
  const by2 = cy - r * Math.sin(endAngle)

  return (
    <div className="gauge-container">
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        {/* Background track */}
        <path
          d={`M ${bx1} ${by1} A ${r} ${r} 0 1 1 ${bx2} ${by2}`}
          fill="none"
          stroke="#334155"
          strokeWidth={14}
          strokeLinecap="round"
        />
        {/* Color segments for reference */}
        {/* Value arc */}
        {clamped > 0.01 && (
          <path
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none"
            stroke={color}
            strokeWidth={14}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="gauge-label" style={{ color }}>{(clamped * 100).toFixed(0)}%</div>
      <div className="gauge-sublabel">Risk · {level}</div>
    </div>
  )
}
