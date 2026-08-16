import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Award, Shield, Eye, AlertTriangle, Route } from 'lucide-react'

export default function DriverCard({ driver }) {
  const navigate = useNavigate()
  const twin = driver.digital_twin || {}
  
  const overallScore = Math.round(twin.historical_safety_score || 85)
  const skillLevel = twin.skill_level || 'Advanced'
  const attention = Math.round(twin.attention_score || 85)
  const fatigue = Math.round(twin.fatigue_score || 85)
  const lane = Math.round(twin.lane_score || 85)

  const getScoreColor = (score) => {
    if (score >= 90) return '#22c55e'
    if (score >= 80) return '#3b82f6'
    if (score >= 70) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div 
      className="driver-card"
      onClick={() => navigate(`/driver/${driver.driver_id}`)}
    >
      <div className="driver-card-header">
        <img 
          src={driver.profile_photo || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + driver.driver_id} 
          alt={driver.full_name}
          className="driver-avatar"
        />
        <div className="driver-header-info">
          <div className="driver-id-badge">{driver.driver_id}</div>
          <h3 className="driver-name">{driver.full_name}</h3>
          <p className="driver-licence">{driver.licence_type} • {driver.years_of_experience} yrs exp</p>
        </div>

        <div className="driver-score-ring" style={{ borderColor: getScoreColor(overallScore) }}>
          <span className="score-val" style={{ color: getScoreColor(overallScore) }}>{overallScore}</span>
          <span className="score-lbl">SAFETY</span>
        </div>
      </div>

      <div className="driver-card-badge-row">
        <span className={`skill-badge level-${skillLevel.toLowerCase()}`}>
          <Award size={13} />
          {skillLevel}
        </span>
        <span className="status-badge">
          {driver.current_status || 'Active'}
        </span>
        <span className="journey-count-badge">
          {twin.total_journeys || 0} Journeys
        </span>
      </div>

      <div className="driver-metrics-list">
        <div className="metric-bar-item">
          <div className="bar-label">
            <span><Eye size={13} color="#3b82f6" /> Attention</span>
            <span className="bar-val">{attention}%</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${attention}%`, background: '#3b82f6' }}></div>
          </div>
        </div>

        <div className="metric-bar-item">
          <div className="bar-label">
            <span><AlertTriangle size={13} color="#22c55e" /> Fatigue Control</span>
            <span className="bar-val">{fatigue}%</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${fatigue}%`, background: '#22c55e' }}></div>
          </div>
        </div>

        <div className="metric-bar-item">
          <div className="bar-label">
            <span><Route size={13} color="#8b5cf6" /> Lane Discipline</span>
            <span className="bar-val">{lane}%</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${lane}%`, background: '#8b5cf6' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
