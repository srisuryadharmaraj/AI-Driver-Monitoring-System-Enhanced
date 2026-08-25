import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Award, Shield, Eye, AlertTriangle, Route } from 'lucide-react'
import DriverAvatar from './DriverAvatar'

export default function DriverCard({ driver }) {
  const navigate = useNavigate()
  const twin = driver.digital_twin || {}
  
  const overallScore = Math.round(twin.historical_safety_score || 85)
  const skillLevel = twin.skill_level || 'Advanced'
  const attention = Math.round(twin.attention_score || 85)
  const fatigue = Math.round(twin.fatigue_score || 85)
  const lane = Math.round(twin.lane_score || 85)

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--safe)'
    if (score >= 80) return 'var(--accent)'
    if (score >= 70) return 'var(--warning)'
    return 'var(--danger)'
  }

  const getRiskBadge = (score) => {
    if (score >= 85) return { label: 'LOW RISK', cls: 'risk-badge-low' }
    if (score >= 70) return { label: 'MODERATE RISK', cls: 'risk-badge-medium' }
    return { label: 'HIGH RISK', cls: 'risk-badge-high' }
  }

  const riskInfo = getRiskBadge(overallScore)

  return (
    <div 
      className="driver-card"
      onClick={() => navigate(`/driver/${driver.driver_id}`)}
    >
      <div className="driver-card-header">
        <div onClick={(e) => e.stopPropagation()}>
          <DriverAvatar driver={driver} size={50} editable={true} />
        </div>
        <div className="driver-header-info">
          <div className="driver-id-badge">{driver.driver_id}</div>
          <h3 className="driver-name" style={{ fontSize: '1rem' }}>{driver.full_name}</h3>
          <p className="driver-licence">{driver.licence_type} • {driver.years_of_experience} yrs exp</p>
        </div>

        <div className="driver-score-ring" style={{ borderColor: getScoreColor(overallScore) }}>
          <span className="score-val" style={{ color: getScoreColor(overallScore) }}>{overallScore}</span>
          <span className="score-lbl">SAFETY</span>
        </div>
      </div>

      <div className="driver-card-badge-row">
        <span className="skill-badge">
          <Award size={12} />
          {skillLevel}
        </span>
        <span className={`driver-id-pill ${riskInfo.cls}`}>
          {riskInfo.label}
        </span>
        <span className="journey-count-badge">
          {twin.total_journeys || 0} Journeys
        </span>
      </div>

      <div className="driver-metrics-list">
        <div className="metric-bar-item">
          <div className="bar-label">
            <span><Eye size={12} color="#00f0ff" /> Attention</span>
            <span className="bar-val">{attention}%</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${attention}%`, background: 'var(--accent-secondary)' }}></div>
          </div>
        </div>

        <div className="metric-bar-item">
          <div className="bar-label">
            <span><AlertTriangle size={12} color="#00e676" /> Fatigue Control</span>
            <span className="bar-val">{fatigue}%</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${fatigue}%`, background: 'var(--safe)' }}></div>
          </div>
        </div>

        <div className="metric-bar-item">
          <div className="bar-label">
            <span><Route size={12} color="#7000ff" /> Lane Discipline</span>
            <span className="bar-val">{lane}%</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${lane}%`, background: 'var(--accent-violet)' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
