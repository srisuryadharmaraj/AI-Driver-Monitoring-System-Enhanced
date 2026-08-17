import React from 'react'
import { useDriver } from '../context/DriverContext'
import DriverAvatar from './DriverAvatar'
import DateRangeFilter from './DateRangeFilter'
import {
  Users, Award, Shield, AlertTriangle, Eye, Activity, Gauge, Route,
  TrendingUp, CheckCircle2, ChevronDown
} from 'lucide-react'

export default function ActiveDriverSelector({ showDateFilter = true, className = '' }) {
  const { drivers, activeDriverId, setActiveDriverId, activeDriver, activeDriverDetail, loading } = useDriver()

  if (loading || !activeDriver) {
    return (
      <div className="active-driver-card loading-state">
        <p>Loading Driver Intelligence Selector...</p>
      </div>
    )
  }

  const detail = activeDriverDetail || {}
  const twin = detail.digital_twin || activeDriver.digital_twin || {}
  const summary = detail.telemetry_summary || {}

  const safetyScore = Math.round(summary.avg_safety_score ?? twin.historical_safety_score ?? 88)
  const skillScore = Math.round(twin.overall_skill_score ?? 85)
  const experienceYears = activeDriver.years_of_experience || 1
  const totalJourneys = summary.total_journeys ?? twin.total_journeys ?? 0
  const safeDrivingPct = Math.round(summary.safe_driving_pct ?? 95)
  const fatigueEvents = summary.fatigue_events ?? 0
  const distractionEvents = summary.distraction_events ?? 0
  const overspeedEvents = summary.overspeed_events ?? 0
  const riskLevel = summary.risk_level || (safetyScore >= 85 ? 'Low Risk' : 'Moderate Risk')
  const overallPerformance = summary.overall_performance || (safetyScore >= 85 ? 'Outstanding' : 'Good')

  const getScoreColor = (score) => {
    if (score >= 90) return '#22c55e'
    if (score >= 80) return '#3b82f6'
    if (score >= 70) return '#f59e0b'
    return '#ef4444'
  }

  const getRiskBadgeClass = (risk) => {
    const r = risk.toLowerCase()
    if (r.includes('low')) return 'risk-badge-low'
    if (r.includes('moderate') || r.includes('elevated')) return 'risk-badge-medium'
    return 'risk-badge-high'
  }

  return (
    <div className={`active-driver-panel ${className}`}>
      <div className="active-driver-top-bar">
        <div className="selector-title-group">
          <Users size={20} color="#3b82f6" />
          <span className="selector-label">ACTIVE DRIVER SELECTOR</span>
        </div>

        <div className="driver-dropdown-wrap">
          <select
            value={activeDriverId}
            onChange={(e) => setActiveDriverId(e.target.value)}
            className="active-driver-select"
          >
            {drivers.map((d) => (
              <option key={d.driver_id} value={d.driver_id}>
                {d.full_name} ({d.driver_id}) — {d.licence_type || 'Commercial'}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="dropdown-arrow-icon" />
        </div>
      </div>

      <div className="active-driver-body">
        {/* Left Column: Photo & Core Identifiers */}
        <div className="driver-identity-col">
          <DriverAvatar driver={detail.full_name ? detail : activeDriver} size={72} editable={true} />
          <div className="identity-text">
            <h3 className="driver-name">{activeDriver.full_name}</h3>
            <div className="driver-subtags">
              <span className="driver-id-pill">{activeDriver.driver_id}</span>
              <span className="experience-pill">{experienceYears} Yrs Exp</span>
              <span className={`risk-pill ${getRiskBadgeClass(riskLevel)}`}>{riskLevel}</span>
            </div>
          </div>
        </div>

        {/* Middle Column: Core Scores & Performance */}
        <div className="driver-scores-grid">
          <div className="score-stat-box">
            <span className="stat-lbl"><Shield size={13} color="#3b82f6" /> Safety Score</span>
            <span className="stat-val" style={{ color: getScoreColor(safetyScore) }}>{safetyScore}/100</span>
          </div>

          <div className="score-stat-box">
            <span className="stat-lbl"><Award size={13} color="#8b5cf6" /> Skill Score</span>
            <span className="stat-val" style={{ color: getScoreColor(skillScore) }}>{skillScore}/100</span>
          </div>

          <div className="score-stat-box">
            <span className="stat-lbl"><Route size={13} color="#22c55e" /> Safe Driving</span>
            <span className="stat-val text-green">{safeDrivingPct}%</span>
          </div>

          <div className="score-stat-box">
            <span className="stat-lbl"><TrendingUp size={13} color="#f59e0b" /> Performance</span>
            <span className="stat-val text-amber">{overallPerformance}</span>
          </div>
        </div>

        {/* Right Column: Telemetry Event Counts */}
        <div className="driver-events-summary">
          <div className="event-count-item">
            <span className="evt-num">{totalJourneys}</span>
            <span className="evt-lbl">Journeys</span>
          </div>
          <div className="event-count-item">
            <span className="evt-num text-amber">{fatigueEvents}</span>
            <span className="evt-lbl">Fatigue</span>
          </div>
          <div className="event-count-item">
            <span className="evt-num text-amber">{distractionEvents}</span>
            <span className="evt-lbl">Distraction</span>
          </div>
          <div className="event-count-item">
            <span className="evt-num text-amber">{overspeedEvents}</span>
            <span className="evt-lbl">Overspeed</span>
          </div>
        </div>
      </div>

      {showDateFilter && (
        <div className="active-driver-footer">
          <DateRangeFilter />
        </div>
      )}
    </div>
  )
}
