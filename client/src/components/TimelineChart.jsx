import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

/**
 * Reusable mini line chart for timelines.
 * data: number[]
 * dangerLine: optional threshold horizontal line
 */
export default function TimelineChart({ data = [], title, yLabel, dangerLine, color = '#3b82f6' }) {
  const chartData = data.map((v, i) => ({ x: i, y: typeof v === 'number' ? +v.toFixed(2) : 0 }))

  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="x" tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: 'Frame', fill: '#64748b', fontSize: 11, position: 'insideBottomRight', offset: -5 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} label={{ value: yLabel, fill: '#64748b', fontSize: 11, angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#94a3b8' }}
          />
          {dangerLine != null && (
            <ReferenceLine y={dangerLine} stroke="#ef4444" strokeDasharray="6 3" label={{ value: 'Threshold', fill: '#ef4444', fontSize: 11 }} />
          )}
          <Line type="monotone" dataKey="y" stroke={color} dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
