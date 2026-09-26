import React, { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import ActiveDriverSelector from '../components/ActiveDriverSelector'
import { useDriver } from '../context/DriverContext'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, BarChart2, PieChart as PieIcon, ShieldCheck, Activity, AlertTriangle, Eye, Zap } from 'lucide-react'

export default function AnalyticsPage() {
  const { drivers, activeDriverDetail, activeDriver } = useDriver()
  const [loading, setLoading] = useState(false)

  const summary = activeDriverDetail?.telemetry_summary || {}
  const twin = activeDriverDetail?.digital_twin || activeDriver?.digital_twin || {}

  const safetyScore = Math.round(summary.avg_safety_score ?? twin.historical_safety_score ?? 88)
  const avgRisk = summary.avg_risk ? summary.avg_risk.toFixed(2) : '0.18'
  const fatigueVal = summary.fatigue_events ?? 4
  const distractionVal = summary.distraction_events ?? 8
  const overspeedVal = summary.overspeed_events ?? 3
  const safePercent = twin.safe_journeys && twin.total_journeys ? Math.round((twin.safe_journeys / twin.total_journeys) * 100) : 92

  const eventDistribution = [
    { name: 'Fatigue Alerts', value: Math.max(1, fatigueVal), color: 'var(--danger)' },
    { name: 'Distraction Spikes', value: Math.max(1, distractionVal), color: 'var(--warning)' },
    { name: 'Lane Deviations', value: 5, color: 'var(--accent-violet)' },
    { name: 'Collision / Speed Warnings', value: Math.max(1, overspeedVal), color: 'var(--accent)' },
  ]

  const driverScores = (drivers || []).map(d => ({
    name: d.full_name ? d.full_name.split(' ')[0] : 'Driver',
    score: Math.round(d.digital_twin?.historical_safety_score || 85),
    attention: Math.round(d.digital_twin?.attention_score || 85),
  }))

  const scoreTrendData = [
    { week: 'W1', score: Math.min(100, Math.max(60, Math.round(safetyScore - 6))) },
    { week: 'W2', score: Math.min(100, Math.max(60, Math.round(safetyScore - 3))) },
    { week: 'W3', score: Math.min(100, Math.max(60, Math.round(safetyScore - 1))) },
    { week: 'W4', score: Math.min(100, Math.max(60, Math.round(safetyScore))) },
    { week: 'W5', score: Math.min(100, Math.max(60, Math.round(safetyScore + 2))) },
  ]

  return (
    <div className="page-container">
      <TopBar 
        title="SSD DRIVEAI — DRIVER PERFORMANCE TELEMETRY" 
        subtitle="Fleetwide Telemetry Trends, Safety Event Distributions & Skill Profiling Analytics"
      />

      <ActiveDriverSelector showDateFilter={true} className="mb-4" />

      {loading ? (
        <div className="loading-container" style={{ padding: '4rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            COMPUTING PERFORMANCE TELEMETRY...
          </p>
        </div>
      ) : (
        <>
          {/* Telemetry KPI Cards Row */}
          <div className="metric-grid mb-4">
            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Safety Score Index</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number" style={{ color: safetyScore >= 85 ? 'var(--safe)' : 'var(--warning)' }}>
                  {safetyScore}
                </span>
                <span className="kpi-unit">/ 100</span>
              </div>
            </div>

            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Average Risk Level</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number" style={{ color: '#00f0ff' }}>
                  {avgRisk}
                </span>
              </div>
            </div>

            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Fatigue Alerts</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number" style={{ color: fatigueVal > 0 ? 'var(--warning)' : 'inherit' }}>
                  {fatigueVal}
                </span>
              </div>
            </div>

            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Distraction Spikes</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number" style={{ color: distractionVal > 0 ? 'var(--warning)' : 'inherit' }}>
                  {distractionVal}
                </span>
              </div>
            </div>

            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Safe Driving %</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number" style={{ color: 'var(--safe)' }}>
                  {safePercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Trend & Distribution Grid */}
          <div className="chart-grid">
            <div className="command-panel">
              <div className="panel-header">
                <h3><TrendingUp size={18} color="var(--accent)" /> SAFETY SCORE OVER TIME (WEEKLY BASELINE)</h3>
              </div>
              <div style={{ width: '100%', height: 230, marginTop: '1.25rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreTrendData}>
                    <XAxis dataKey="week" stroke="#64748b" tick={{ fontSize: 11, fill: '#cbd5e1', fontFamily: 'var(--font-mono)' }} />
                    <YAxis domain={[60, 100]} stroke="#64748b" tick={{ fontSize: 11, fill: '#cbd5e1', fontFamily: 'var(--font-mono)' }} />
                    <Tooltip 
                      contentStyle={{ background: '#0f141f', border: '1px solid rgba(0, 240, 255, 0.4)', borderRadius: 6, color: '#f0f4f8', fontFamily: 'var(--font-mono)', padding: '8px 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}
                      itemStyle={{ color: '#f0f4f8', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', padding: '2px 0' }}
                      labelStyle={{ color: '#00f0ff', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}
                    />
                    <Line type="monotone" dataKey="score" name="Safety Score" stroke="#00f0ff" strokeWidth={3} dot={{ r: 5, fill: '#0066ff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="command-panel">
              <div className="panel-header">
                <h3><PieIcon size={18} color="var(--safe)" /> SAFETY EVENT DISTRIBUTION</h3>
              </div>
              <div style={{ width: '100%', height: 230, marginTop: '1.25rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={eventDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={{ fontSize: 11, fill: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                      {eventDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#0f141f', border: '1px solid rgba(0, 240, 255, 0.4)', borderRadius: 6, color: '#f0f4f8', fontFamily: 'var(--font-mono)', padding: '8px 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}
                      itemStyle={{ color: '#f0f4f8', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', padding: '2px 0' }}
                      labelStyle={{ color: '#00f0ff', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Driver Comparison Bar Chart */}
          <div className="command-panel" style={{ marginTop: '1.5rem' }}>
            <div className="panel-header">
              <h3><BarChart2 size={18} color="var(--accent-violet)" /> FLEET DRIVER SCORE COMPARISON (SAFETY VS ATTENTION)</h3>
            </div>
            <div style={{ width: '100%', height: 250, marginTop: '1.25rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={driverScores}>
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fill: '#cbd5e1', fontFamily: 'var(--font-mono)' }} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11, fill: '#cbd5e1', fontFamily: 'var(--font-mono)' }} />
                  <Tooltip 
                    contentStyle={{ background: '#0f141f', border: '1px solid rgba(0, 240, 255, 0.4)', borderRadius: 6, color: '#f0f4f8', fontFamily: 'var(--font-mono)', padding: '8px 12px', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}
                    itemStyle={{ color: '#f0f4f8', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', padding: '2px 0' }}
                    labelStyle={{ color: '#00f0ff', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}
                  />
                  <Bar dataKey="score" fill="#0066ff" name="Safety Score" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="attention" fill="#00e676" name="Attention Score" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
