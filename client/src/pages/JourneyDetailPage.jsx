import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import SafetyScoreGauge from '../components/SafetyScoreGauge'
import { ArrowLeft, Clock, AlertTriangle, ShieldCheck, AlertCircle, ChevronRight, Activity, Cpu } from 'lucide-react'

export default function JourneyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [journey, setJourney] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/journeys/${id}`)
      .then(r => r.json())
      .then(data => {
        setJourney(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading || !journey) {
    return (
      <div className="page-container">
        <TopBar title="SSD DRIVEAI — JOURNEY BLACK BOX REPORT" />
        <div className="loading-container" style={{ padding: '4rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            LOADING JOURNEY BLACK BOX DATA...
          </p>
        </div>
      </div>
    )
  }

  const breakdown = journey.score_breakdown || {}

  // Construct Black Box Event Recorder Timeline
  const realEvents = (journey.events || journey.safety_events || []).map(e => ({
    time: e.timestamp || e.time || '00:00',
    title: e.event_type || e.title || 'Safety Event Recorded',
    type: e.severity === 'HIGH' || e.severity === 'CRITICAL' ? 'danger' : e.severity === 'MEDIUM' ? 'warning' : 'info',
    desc: e.description || e.desc || `Risk Score: ${e.risk_score?.toFixed(2) || '0.50'}`
  }))

  const defaultTimeline = [
    { time: '00:00', title: 'Journey Monitoring Session Started', type: 'info', desc: `Mode: ${journey.monitoring_mode} · Driver: ${journey.driver_name}` },
    ...(journey.fatigue_events > 0 ? [{ time: '00:12', title: 'Fatigue / Drowsiness Indicator Detected', type: 'danger', desc: 'Eye Aspect Ratio (EAR) dropped below critical safety threshold' }] : []),
    ...(journey.distraction_events > 0 ? [{ time: '00:24', title: 'Head Pose Distraction Alert', type: 'warning', desc: 'Head rotation yaw/pitch offset from primary direction of travel' }] : []),
    ...(journey.obstacle_warnings > 0 ? [{ time: '00:38', title: 'Forward Collision Proximity Hazard', type: 'danger', desc: `${journey.obstacle_warnings} obstacle hazard proximity warning(s) logged` }] : []),
    ...(journey.overspeed_events > 0 ? [{ time: '00:45', title: 'Telemetry Overspeed Exceedance', type: 'warning', desc: `${journey.overspeed_events} speed limit violation(s) recorded` }] : []),
    { time: `${journey.duration_min || 15}:00`, title: 'Journey Completed & Telemetry Logged', type: 'success', desc: `Final Journey Safety Score: ${Math.round(journey.journey_safety_score)}/100` }
  ]

  const timelineEvents = realEvents.length > 0 ? realEvents : defaultTimeline

  return (
    <div className="page-container">
      <TopBar 
        title={`SSD DRIVEAI — JOURNEY BLACK BOX REPORT`} 
        subtitle={`Session: ${journey.journey_id} • Driver: ${journey.driver_name} • Date: ${journey.date} ${journey.start_time}`}
      />

      <div style={{ marginBottom: '1.25rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/journeys')}>
          <ArrowLeft size={16} /> Back to Journey History
        </button>
      </div>

      {/* Primary Telemetry Instrument Metric Cards */}
      <div className="metric-grid mb-4">
        <div className="kpi-card card-accent-border">
          <span className="kpi-title">JOURNEY SAFETY SCORE</span>
          <div className="kpi-value-wrap">
            <span className="telemetry-number" style={{ color: journey.journey_safety_score >= 85 ? 'var(--safe)' : journey.journey_safety_score >= 70 ? 'var(--warning)' : 'var(--danger)' }}>
              {Math.round(journey.journey_safety_score)}
            </span>
            <span className="kpi-unit">/ 100</span>
          </div>
        </div>

        <div className="kpi-card card-accent-border">
          <span className="kpi-title">AVERAGE RISK SCORE</span>
          <div className="kpi-value-wrap">
            <span className="telemetry-number">{journey.average_risk}</span>
          </div>
        </div>

        <div className="kpi-card card-accent-border">
          <span className="kpi-title">MAXIMUM RISK PEAK</span>
          <div className="kpi-value-wrap">
            <span className="telemetry-number" style={{ color: journey.maximum_risk > 0.6 ? 'var(--danger)' : 'var(--safe)' }}>
              {journey.maximum_risk}
            </span>
          </div>
        </div>

        <div className="kpi-card card-accent-border">
          <span className="kpi-title">FATIGUE EVENTS</span>
          <div className="kpi-value-wrap">
            <span className="telemetry-number">{journey.fatigue_events}</span>
          </div>
        </div>

        <div className="kpi-card card-accent-border">
          <span className="kpi-title">DISTRACTION EVENTS</span>
          <div className="kpi-value-wrap">
            <span className="telemetry-number">{journey.distraction_events}</span>
          </div>
        </div>

        <div className={`kpi-card card-accent-border ${journey.obstacle_warnings > 0 ? 'card-danger' : ''}`}>
          <span className="kpi-title">OBSTACLE HAZARDS</span>
          <div className="kpi-value-wrap">
            <span className="telemetry-number" style={{ color: journey.obstacle_warnings > 0 ? 'var(--danger)' : 'var(--safe)' }}>
              {journey.obstacle_warnings}
            </span>
          </div>
        </div>
      </div>

      {/* Score Gauge & Visual Timeline */}
      <div className="profile-two-col">
        <SafetyScoreGauge scoreData={breakdown} />

        <div className="command-panel">
          <div className="panel-header">
            <h3><Clock size={18} color="var(--accent)" /> VEHICLE EVENT RECORDER TIMELINE</h3>
            <span className="badge badge-info">{journey.monitoring_mode} Session</span>
          </div>

          <div className="timeline-container">
            {timelineEvents.map((ev, idx) => (
              <div key={idx} className={`timeline-item item-${ev.type}`}>
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-time">{ev.time}</div>
                  <div className="timeline-title">{ev.title}</div>
                  <div className="timeline-desc">{ev.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
