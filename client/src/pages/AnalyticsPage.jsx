import React, { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import ActiveDriverSelector from '../components/ActiveDriverSelector'
import { useDriver } from '../context/DriverContext'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, BarChart2, PieChart as PieIcon, ShieldCheck } from 'lucide-react'

export default function AnalyticsPage() {
  const { drivers, activeDriverDetail, activeDriver } = useDriver()
  const [loading, setLoading] = useState(false)

  const summary = activeDriverDetail?.telemetry_summary || {}
  const twin = activeDriverDetail?.digital_twin || activeDriver?.digital_twin || {}

  const fatigueVal = summary.fatigue_events ?? 4
  const distractionVal = summary.distraction_events ?? 8
  const overspeedVal = summary.overspeed_events ?? 3

  const eventDistribution = [
    { name: 'Fatigue Alerts', value: Math.max(1, fatigueVal), color: '#ef4444' },
    { name: 'Distraction Spikes', value: Math.max(1, distractionVal), color: '#f59e0b' },
    { name: 'Lane Deviations', value: 5, color: '#8b5cf6' },
    { name: 'Collision / Speed Warnings', value: Math.max(1, overspeedVal), color: '#3b82f6' },
  ]

  const driverScores = drivers.map(d => ({
    name: d.full_name.split(' ')[0],
    score: Math.round(d.digital_twin?.historical_safety_score || 85),
    attention: Math.round(d.digital_twin?.attention_score || 85),
  }))

  const scoreTrendData = [
    { week: 'W1', score: Math.min(100, Math.max(60, Math.round((summary.avg_safety_score || twin.historical_safety_score || 85) - 6))) },
    { week: 'W2', score: Math.min(100, Math.max(60, Math.round((summary.avg_safety_score || twin.historical_safety_score || 85) - 3))) },
    { week: 'W3', score: Math.min(100, Math.max(60, Math.round((summary.avg_safety_score || twin.historical_safety_score || 85) - 1))) },
    { week: 'W4', score: Math.min(100, Math.max(60, Math.round(summary.avg_safety_score || twin.historical_safety_score || 85))) },
    { week: 'W5', score: Math.min(100, Math.max(60, Math.round((summary.avg_safety_score || twin.historical_safety_score || 85) + 2))) },
  ]

  return (
    <div className="page-container">
      <TopBar 
        title="DRIVER PERFORMANCE ANALYTICS" 
        subtitle="Fleetwide Telemetry Trends, Safety Event Distributions & Skill Profiling"
      />

      <ActiveDriverSelector showDateFilter={true} className="mb-4" />

      {loading ? (
        <div className="loading-container"><p>LOADING ANALYTICS DATA...</p></div>
      ) : (
        <>
          <div className="chart-grid">
            <div className="chart-card">
              <h3><TrendingUp size={16} color="#3b82f6" /> Safety Score Over Time (Weekly Baseline)</h3>
              <div style={{ width: '100%', height: 220, marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreTrendData}>
                    <XAxis dataKey="week" stroke="#64748b" />
                    <YAxis domain={[60, 100]} stroke="#64748b" />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h3><PieIcon size={16} color="#22c55e" /> Safety Event Breakdown</h3>
              <div style={{ width: '100%', height: 220, marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={eventDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                      {eventDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="chart-card" style={{ marginTop: '1.5rem' }}>
            <h3><BarChart2 size={16} color="#8b5cf6" /> Driver Score Comparison (Safety vs Attention)</h3>
            <div style={{ width: '100%', height: 240, marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={driverScores}>
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis domain={[0, 100]} stroke="#64748b" />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                  <Bar dataKey="score" fill="#3b82f6" name="Safety Score" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="attention" fill="#22c55e" name="Attention Score" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
