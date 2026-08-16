import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import SafetyScoreGauge from '../components/SafetyScoreGauge'
import { ArrowLeft, Clock, AlertTriangle, ShieldCheck, AlertCircle, ChevronRight } from 'lucide-react'

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
        <TopBar title="JOURNEY TELEMETRY ANALYSIS" />
        <div className="loading-container"><p>LOADING JOURNEY SESSION DATA...</p></div>
      </div>
    )
  }

  const breakdown = journey.score_breakdown || {}

  // Mock timeline events for rich visualization
  const timelineEvents = [
    { time: '00:02', title: 'Journey Monitoring Commenced', type: 'info', desc: `Mode: ${journey.monitoring_mode}` },
    ...(journey.fatigue_events > 0 ? [{ time: '00:14', title: 'Fatigue / Drowsiness Indicator Detected', type: 'danger', desc: 'Eye closure threshold exceeded (EAR < 0.25)' }] : []),
    ...(journey.distraction_events > 0 ? [{ time: '00:22', title: 'Head Pose Distraction Event', type: 'warning', desc: 'Yaw/pitch head rotation away from forward road angle' }] : []),
    ...(journey.obstacle_warnings > 0 ? [{ time: '00:35', title: 'Forward Obstacle Distance Warning', type: 'warning', desc: 'Approaching vehicle proximity alert' }] : []),
    { time: `00:${journey.duration_min || 15}`, title: 'Journey Completed & Telemetry Logged', type: 'success', desc: `Safety Score: ${journey.journey_safety_score}/100` }
  ]

  return (
    <div className="page-container">
      <TopBar 
        title={`JOURNEY DETAIL · ${journey.journey_id}`} 
        subtitle={`Driver: ${journey.driver_name} • Date: ${journey.date} ${journey.start_time}`}
      />

      <button className="btn btn-outline" style={{ marginBottom: '1rem' }} onClick={() => navigate('/journeys')}>
        <ArrowLeft size={16} /> Back to Journey History
      </button>

      {/* KPI Row */}
      <div className="metric-grid">
        <div className="card">
          <div className="card-title">JOURNEY SAFETY SCORE</div>
          <div className="card-value" style={{ color: journey.journey_safety_score >= 85 ? '#22c55e' : '#f59e0b' }}>
            {Math.round(journey.journey_safety_score)} <small style={{ fontSize: '1rem' }}>/ 100</small>
          </div>
        </div>

        <div className="card">
          <div className="card-title">AVERAGE RISK SCORE</div>
          <div className="card-value">{journey.average_risk}</div>
        </div>

        <div className="card">
          <div className="card-title">MAXIMUM RISK PEAK</div>
          <div className="card-value" style={{ color: journey.maximum_risk > 0.6 ? '#ef4444' : '#22c55e' }}>
            {journey.maximum_risk}
          </div>
        </div>

        <div className="card">
          <div className="card-title">FATIGUE EVENTS</div>
          <div className="card-value">{journey.fatigue_events}</div>
        </div>

        <div className="card">
          <div className="card-title">DISTRACTION EVENTS</div>
          <div className="card-value">{journey.distraction_events}</div>
        </div>
      </div>

      {/* Score Gauge & Timeline */}
      <div className="profile-two-col">
        <SafetyScoreGauge scoreData={breakdown} />

        <div className="command-panel">
          <div className="panel-header">
            <h3><Clock size={18} color="#3b82f6" /> VISUAL JOURNEY EVENT TIMELINE</h3>
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
