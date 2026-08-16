import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react'
import TopBar from '../components/TopBar'
import SkillRadarChart from '../components/SkillRadarChart'
import SafetyScoreGauge from '../components/SafetyScoreGauge'
import { Award, Shield, Eye, AlertTriangle, Route, ArrowLeft, CheckCircle2, AlertCircle, FileText } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function DriverProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [driver, setDriver] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/drivers/${id}`)
      .then(r => r.json())
      .then(data => {
        setDriver(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading || !driver) {
    return (
      <div className="page-container">
        <TopBar title="DRIVER INTELLIGENCE PROFILE" />
        <div className="loading-container"><p>LOADING DRIVER TELEMETRY PROFILE...</p></div>
      </div>
    )
  }

  const twin = driver.digital_twin || {}
  const journeys = driver.journeys || []
  const overallScore = Math.round(twin.historical_safety_score || 88)
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
        title={`DRIVER INTELLIGENCE CARD · ${driver.full_name}`} 
        subtitle={`Driver ID: ${driver.driver_id} • Verified Performance Credentials`}
      />

      <button className="btn btn-outline" style={{ marginBottom: '1rem' }} onClick={() => navigate('/drivers')}>
        <ArrowLeft size={16} /> Back to All Drivers
      </button>

      {/* Profile Header */}
      <div className="profile-header-card">
        <img 
          src={driver.profile_photo || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + driver.driver_id} 
          alt={driver.full_name}
          className="profile-large-avatar"
        />

        <div className="profile-header-main">
          <div className="profile-badge-row">
            <span className="driver-id-tag">{driver.driver_id}</span>
            <span className={`skill-badge level-${skillLevel.toLowerCase()}`}>
              <Award size={14} /> {skillLevel} Driver
            </span>
            <span className="status-badge">{driver.current_status}</span>
          </div>

          <h2>{driver.full_name}</h2>
          <p className="profile-subdetail">
            Licence: <strong>{driver.licence_number}</strong> ({driver.licence_type}) • Exp: {driver.years_of_experience} Years • Email: {driver.email}
          </p>

          <div className="profile-header-quick-stats">
            <div className="quick-stat">
              <span className="qs-label">Total Journeys</span>
              <span className="qs-val">{twin.total_journeys || 0}</span>
            </div>
            <div className="quick-stat">
              <span className="qs-label">Safe Journeys</span>
              <span className="qs-val text-green">{twin.safe_journeys || 0}</span>
            </div>
            <div className="quick-stat">
              <span className="qs-label">Total Risk Events</span>
              <span className="qs-val text-amber">{twin.total_risk_events || 0}</span>
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
            <h3><Award size={18} color="#3b82f6" /> SKILL RADAR MATRIX</h3>
          </div>
          <SkillRadarChart twin={twin} />
        </div>

        <SafetyScoreGauge scoreData={scoreData} />
      </div>

      {/* Performance Trend */}
      {chartData.length > 0 && (
        <div className="command-panel chart-panel" style={{ marginTop: '1.5rem' }}>
          <div className="panel-header">
            <h3>HISTORICAL JOURNEY PERFORMANCE TREND</h3>
          </div>
          <div style={{ width: '100%', height: 200, marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis domain={[50, 100]} stroke="#64748b" />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* AI Insights & Passport Action */}
      <div className="profile-insights-row" style={{ marginTop: '1.5rem' }}>
        <div className="insight-box strengths-box">
          <h4><CheckCircle2 size={18} color="#22c55e" /> DEMONSTRATED STRENGTHS</h4>
          <ul>
            {(twin.strengths || ['High forward attentiveness', 'Consistent speed regulation']).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="insight-box improvements-box">
          <h4><AlertCircle size={18} color="#f59e0b" /> AREAS FOR IMPROVEMENT</h4>
          <ul>
            {(twin.improvement_areas || ['Maintain rest intervals during extended drives']).map((imp, i) => (
              <li key={i}>{imp}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
        <button className="btn btn-primary" onClick={() => navigate(`/passport?driver_id=${driver.driver_id}`)}>
          <FileText size={18} /> View Verified Driver Skill Passport
        </button>
      </div>
    </div>
  )
}
