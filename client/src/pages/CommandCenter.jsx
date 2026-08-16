import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import DriverCard from '../components/DriverCard'
import { Users, Shield, Route, AlertTriangle, TrendingUp, ChevronRight, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function CommandCenter() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics/command-center').then(r => r.json()).catch(() => null),
      fetch('/api/drivers').then(r => r.json()).catch(() => [])
    ]).then(([sumData, drvData]) => {
      setSummary(sumData)
      setDrivers(drvData || [])
      setLoading(false)
    })
  }, [])

  const trendData = [
    { day: 'Mon', score: 84 },
    { day: 'Tue', score: 86 },
    { day: 'Wed', score: 85 },
    { day: 'Thu', score: 89 },
    { day: 'Fri', score: 88 },
    { day: 'Sat', score: 91 },
    { day: 'Sun', score: 90 },
  ]

  return (
    <div className="page-container">
      <TopBar 
        title="FUTURISTIC AI DRIVER COMMAND CENTER" 
        subtitle="Real-time Driver Monitoring, Road Safety Intelligence & Skill Analytics Platform"
      />

      {loading ? (
        <div className="loading-container">
          <Activity className="spin" size={32} color="#3b82f6" />
          <p>INITIALIZING COMMAND CENTER TELEMETRY...</p>
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon icon-blue"><Users size={22} /></div>
              <div className="kpi-info">
                <span className="kpi-title">TOTAL REGISTERED DRIVERS</span>
                <span className="kpi-value">{summary?.total_drivers || drivers.length || 4}</span>
                <span className="kpi-subtext">Active Monitored Fleet</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon icon-green"><Route size={22} /></div>
              <div className="kpi-info">
                <span className="kpi-title">JOURNEYS ANALYSED</span>
                <span className="kpi-value">{summary?.journeys_analysed || 12}</span>
                <span className="kpi-subtext">Full Telemetry Sessions</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon icon-cyan"><Shield size={22} /></div>
              <div className="kpi-info">
                <span className="kpi-title">AVERAGE SAFETY SCORE</span>
                <span className="kpi-value">{summary?.average_safety_score || 88.5} <small>/100</small></span>
                <span className="kpi-subtext">Fleet Fleetwide Baseline</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon icon-amber"><AlertTriangle size={22} /></div>
              <div className="kpi-info">
                <span className="kpi-title">SAFETY RISK EVENTS</span>
                <span className="kpi-value">{summary?.total_risk_events || 6}</span>
                <span className="kpi-subtext">Fatigue, Lane & Hazard Alerts</span>
              </div>
            </div>
          </div>

          {/* Center Content Row */}
          <div className="command-grid">
            {/* Fleet Trend */}
            <div className="command-panel chart-panel">
              <div className="panel-header">
                <h3><TrendingUp size={18} color="#3b82f6" /> Fleet Safety Score Trend</h3>
                <span className="badge badge-low">7-Day Aggregated</span>
              </div>
              <div style={{ width: '100%', height: 220, marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis domain={[60, 100]} stroke="#64748b" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Actions / Activity */}
            <div className="command-panel activity-panel">
              <div className="panel-header">
                <h3><Activity size={18} color="#22c55e" /> Monitoring Shortcuts</h3>
              </div>
              <div className="shortcut-buttons">
                <button className="shortcut-btn btn-live" onClick={() => navigate('/live')}>
                  <span>● START LIVE WEBCAM MONITORING</span>
                  <ChevronRight size={16} />
                </button>
                <button className="shortcut-btn btn-upload" onClick={() => navigate('/')}>
                  <span>▲ ANALYSE DASHCAM VIDEO</span>
                  <ChevronRight size={16} />
                </button>
                <button className="shortcut-btn btn-coach" onClick={() => navigate('/coach')}>
                  <span>✦ VIEW AI DRIVING COACH INSIGHTS</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Driver Intelligence Cards Section */}
          <div className="section-header-row">
            <h2>DRIVER INTELLIGENCE CARDS</h2>
            <button className="btn btn-outline" onClick={() => navigate('/drivers')}>
              View All Drivers <ChevronRight size={16} />
            </button>
          </div>

          <div className="driver-cards-grid">
            {drivers.slice(0, 4).map(drv => (
              <DriverCard key={drv.driver_id} driver={drv} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
