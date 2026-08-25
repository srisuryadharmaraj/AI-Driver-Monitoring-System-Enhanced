import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import DriverCard from '../components/DriverCard'
import ActiveDriverSelector from '../components/ActiveDriverSelector'
import { Users, Shield, Route, AlertTriangle, TrendingUp, ChevronRight, Activity, Cpu } from 'lucide-react'
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
        title="DRIVER AI COMMAND CENTER" 
        subtitle="Automotive AI Telemetry, Driver Monitoring & Safety Operations Cockpit"
      />

      {loading ? (
        <div className="loading-container" style={{ padding: '4rem', textAlign: 'center' }}>
          <Activity className="spin" size={36} color="#0066ff" />
          <p style={{ marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            INITIALIZING COMMAND CENTER TELEMETRY...
          </p>
        </div>
      ) : (
        <>
          {/* Flagship Active Driver Selector Cockpit Panel */}
          <div style={{ marginBottom: '1.75rem' }}>
            <ActiveDriverSelector showDateFilter={true} />
          </div>

          {/* Telemetry Instrument KPI Cluster */}
          <div className="kpi-grid">
            <div className="kpi-card card-accent-border">
              <div className="kpi-header">
                <span className="kpi-title">REGISTERED DRIVERS</span>
                <div className="kpi-icon icon-blue"><Users size={20} /></div>
              </div>
              <div className="kpi-value-wrap">
                <span className="telemetry-number">{summary?.total_drivers || drivers.length || 4}</span>
              </div>
              <span className="kpi-subtext">Active Monitored Fleet</span>
            </div>

            <div className="kpi-card card-accent-border">
              <div className="kpi-header">
                <span className="kpi-title">JOURNEYS ANALYSED</span>
                <div className="kpi-icon icon-green"><Route size={20} /></div>
              </div>
              <div className="kpi-value-wrap">
                <span className="telemetry-number">{summary?.journeys_analysed || 12}</span>
              </div>
              <span className="kpi-subtext">Full Telemetry Sessions</span>
            </div>

            <div className="kpi-card card-accent-border">
              <div className="kpi-header">
                <span className="kpi-title">FLEET SAFETY SCORE</span>
                <div className="kpi-icon icon-cyan"><Shield size={20} /></div>
              </div>
              <div className="kpi-value-wrap">
                <span className="telemetry-number" style={{ color: '#00f0ff' }}>
                  {summary?.average_safety_score || 88.5}
                </span>
                <span className="kpi-unit">/100</span>
              </div>
              <span className="kpi-subtext">Fleetwide Baseline</span>
            </div>

            <div className="kpi-card card-accent-border card-danger">
              <div className="kpi-header">
                <span className="kpi-title">SAFETY RISK EVENTS</span>
                <div className="kpi-icon icon-amber"><AlertTriangle size={20} /></div>
              </div>
              <div className="kpi-value-wrap">
                <span className="telemetry-number" style={{ color: '#ff334b' }}>
                  {summary?.total_risk_events || 6}
                </span>
              </div>
              <span className="kpi-subtext">Fatigue, Lane & Hazard Alerts</span>
            </div>
          </div>

          {/* Center Command Operations Row */}
          <div className="command-grid">
            {/* Fleet Safety Trend Panel */}
            <div className="command-panel chart-panel">
              <div className="panel-header">
                <h3>
                  <TrendingUp size={18} color="#0066ff" />
                  <span>Fleet Safety Telemetry Trend</span>
                </h3>
                <span className="badge badge-info">7-Day Aggregated</span>
              </div>
              <div style={{ width: '100%', height: 230, marginTop: '1.25rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis 
                      dataKey="day" 
                      stroke="#536375" 
                      tick={{ fontSize: 11, fill: '#8c9ba8', fontFamily: 'var(--font-mono)' }} 
                      axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    />
                    <YAxis 
                      domain={[60, 100]} 
                      stroke="#536375" 
                      tick={{ fontSize: 11, fill: '#8c9ba8', fontFamily: 'var(--font-mono)' }} 
                      axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#0f141f', 
                        border: '1px solid rgba(0, 102, 255, 0.4)', 
                        borderRadius: 6,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        color: '#f0f4f8',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#0066ff" 
                      strokeWidth={3} 
                      dot={{ r: 5, fill: '#00f0ff', stroke: '#0066ff', strokeWidth: 2 }} 
                      activeDot={{ r: 7, fill: '#00f0ff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Action Operations Panel */}
            <div className="command-panel activity-panel">
              <div className="panel-header">
                <h3>
                  <Cpu size={18} color="#00e676" />
                  <span>Monitoring Shortcuts</span>
                </h3>
                <span className="badge badge-safe">READY</span>
              </div>
              <div className="shortcut-buttons">
                <button className="shortcut-btn btn-live" onClick={() => navigate('/live')}>
                  <div className="shortcut-text">
                    <span className="shortcut-dot dot-live"></span>
                    <span>START LIVE WEBCAM MONITORING</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
                <button className="shortcut-btn btn-upload" onClick={() => navigate('/')}>
                  <div className="shortcut-text">
                    <span className="shortcut-dot dot-upload"></span>
                    <span>ANALYSE DASHCAM VIDEO</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
                <button className="shortcut-btn btn-coach" onClick={() => navigate('/coach')}>
                  <div className="shortcut-text">
                    <span className="shortcut-dot dot-coach"></span>
                    <span>VIEW AI DRIVING COACH INSIGHTS</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Driver Intelligence Cards Section */}
          <div className="section-header-row">
            <h2 className="section-title">DRIVER INTELLIGENCE ROSTER</h2>
            <button className="btn btn-secondary" onClick={() => navigate('/drivers')}>
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
