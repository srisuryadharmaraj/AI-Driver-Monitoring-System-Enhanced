import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import SkillRadarChart from '../components/SkillRadarChart'
import SafetyScoreGauge from '../components/SafetyScoreGauge'
import DriverAvatar from '../components/DriverAvatar'
import DateRangeFilter from '../components/DateRangeFilter'
import { useDriver } from '../context/DriverContext'
import { Award, Shield, Eye, AlertTriangle, Route, ArrowLeft, CheckCircle2, AlertCircle, FileText, Cpu } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function DriverProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { dateRange, activeDriverDetail } = useDriver()
  const [driver, setDriver] = useState(null)
  const [loading, setLoading] = useState(true)

  // Sync profile photo or detail changes from DriverContext
  useEffect(() => {
    if (activeDriverDetail && activeDriverDetail.driver_id === id) {
      setDriver(prev => prev ? { ...prev, profile_photo: activeDriverDetail.profile_photo } : activeDriverDetail)
    }
  }, [activeDriverDetail, id])

  useEffect(() => {
    let url = `/api/drivers/${id}`
    const params = new URLSearchParams()
    if (dateRange.preset === 'custom') {
      if (dateRange.fromDate) params.append('start_date', dateRange.fromDate)
      if (dateRange.toDate) params.append('end_date', dateRange.toDate)
    } else if (dateRange.preset !== 'all') {
      const days = dateRange.preset === '7d' ? 7 : dateRange.preset === '30d' ? 30 : 90
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - days)
      params.append('start_date', start.toISOString().split('T')[0])
      params.append('end_date', end.toISOString().split('T')[0])
    }
    if (params.toString()) url += `?${params.toString()}`

    setLoading(true)
    fetch(url)
      .then(r => r.json())
      .then(data => {
        setDriver(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id, dateRange])

  if (loading || !driver || driver.detail) {
    return (
      <div className="page-container">
        <TopBar title="SSD DRIVEAI — DIGITAL DRIVER PERFORMANCE CREDENTIAL" />
        <div className="loading-container" style={{ padding: '4rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            LOADING DRIVER TELEMETRY PROFILE...
          </p>
        </div>
      </div>
    )
  }

  const twin = driver.digital_twin || {}
  const summary = driver.telemetry_summary || {}
  const journeys = driver.journeys || []
  const overallScore = Math.round(summary.avg_safety_score ?? twin.historical_safety_score ?? 88)
  const skillLevel = twin.skill_level || 'Advanced'

  const scoreData = {
    score: overallScore,
    rating: overallScore >= 90 ? 'Excellent' : overallScore >= 80 ? 'Good' : 'Needs Focus',
    factors: [
      { name: 'Attention Score', score: Math.round((twin.attention_score || 85) * 0.25), max: 25 },
      { name: 'Lane Discipline', score: Math.round((twin.lane_score || 85) * 0.25), max: 25 },
      { name: 'Fatigue Control', score: Math.round((twin.fatigue_score || 85) * 0.25), max: 25 },
      { name: 'Risk Management', score: Math.round((twin.risk_control_score || 85) * 0.25), max: 25 },
    ]
  }

  const chartData = journeys.slice(0, 10).reverse().map((j, idx) => ({
    name: `J${idx + 1}`,
    score: j.journey_safety_score
  }))

  return (
    <div className="page-container">
      <TopBar 
        title={`SSD DRIVEAI — DIGITAL DRIVER PERFORMANCE CREDENTIAL`} 
        subtitle={`Driver: ${driver.full_name} (${driver.driver_id}) • Verified Telemetry & Skill Audit`}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/drivers')}>
          <ArrowLeft size={16} /> Back to All Drivers
        </button>
        <DateRangeFilter />
      </div>

      {/* Driver Profile Header Card */}
      <div className="profile-header-card">
        <DriverAvatar driver={driver} size={84} editable={true} />

        <div className="profile-header-main">
          <div className="profile-badge-row">
            <span className="driver-id-tag">{driver.driver_id}</span>
            <span className="skill-badge">
              <Award size={14} /> {skillLevel} Driver
            </span>
            <span className="status-badge">{driver.current_status || 'Active'}</span>
          </div>

          <h2>{driver.full_name}</h2>
          <p className="profile-subdetail">
            Licence: <strong>{driver.licence_number}</strong> ({driver.licence_type}) • Experience: <strong>{driver.years_of_experience} Years</strong> • Email: {driver.email}
          </p>

          <div className="profile-header-quick-stats">
            <div className="quick-stat">
              <span className="qs-label">Total Journeys</span>
              <span className="qs-val">{twin.total_journeys || 0}</span>
            </div>
            <div className="quick-stat">
              <span className="qs-label">Safe Journeys</span>
              <span className="qs-val" style={{ color: 'var(--safe)' }}>{twin.safe_journeys || 0}</span>
            </div>
            <div className="quick-stat">
              <span className="qs-label">Total Risk Events</span>
              <span className="qs-val" style={{ color: 'var(--warning)' }}>{twin.total_risk_events || 0}</span>
            </div>
          </div>
        </div>

        <div className="profile-score-display">
          <span className="big-profile-score">{overallScore}</span>
          <span className="score-caption">OVERALL SCORE</span>
        </div>
      </div>

      {/* Matrix & Gauge */}
      <div className="profile-two-col">
        <div className="command-panel">
          <div className="panel-header">
            <h3><Award size={18} color="var(--accent)" /> SKILL RADAR MATRIX</h3>
          </div>
          <SkillRadarChart twin={twin} />
        </div>

        <SafetyScoreGauge scoreData={scoreData} />
      </div>

      {/* Performance Trend */}
      {chartData.length > 0 && (
        <div className="command-panel chart-panel" style={{ marginTop: '1.5rem' }}>
          <div className="panel-header">
            <h3><Cpu size={18} color="var(--accent-secondary)" /> HISTORICAL JOURNEY PERFORMANCE TREND</h3>
            <span className="badge badge-info">Telemetry History</span>
          </div>
          <div style={{ width: '100%', height: 210, marginTop: '1.25rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="name" stroke="#536375" tick={{ fontSize: 11, fill: '#8c9ba8', fontFamily: 'var(--font-mono)' }} />
                <YAxis domain={[50, 100]} stroke="#536375" tick={{ fontSize: 11, fill: '#8c9ba8', fontFamily: 'var(--font-mono)' }} />
                <Tooltip contentStyle={{ background: '#0f141f', border: '1px solid rgba(0, 102, 255, 0.4)', borderRadius: 6, color: '#f0f4f8', fontFamily: 'var(--font-mono)' }} />
                <Line type="monotone" dataKey="score" stroke="#00e676" strokeWidth={3} dot={{ r: 5, fill: '#00f0ff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* AI Insights & Profile Action */}
      <div className="profile-insights-row" style={{ marginTop: '1.5rem' }}>
        <div className="insight-box">
          <h4 style={{ color: 'var(--safe)' }}><CheckCircle2 size={18} /> DEMONSTRATED STRENGTHS</h4>
          <ul>
            {(twin.strengths || ['High forward attentiveness', 'Consistent speed regulation']).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="insight-box">
          <h4 style={{ color: 'var(--warning)' }}><AlertCircle size={18} /> AREAS FOR IMPROVEMENT</h4>
          <ul>
            {(twin.improvement_areas || ['Maintain rest intervals during extended drives']).map((imp, i) => (
              <li key={i}>{imp}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
        <button className="btn btn-primary" onClick={() => navigate(`/profile?driver_id=${driver.driver_id}`)}>
          <FileText size={18} /> View Verified Driver Profile
        </button>
      </div>
    </div>
  )
}
