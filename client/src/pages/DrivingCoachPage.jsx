import React, { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import ActiveDriverSelector from '../components/ActiveDriverSelector'
import DriverAvatar from '../components/DriverAvatar'
import CoachingActionPlan from '../components/CoachingActionPlan'
import { useDriver } from '../context/DriverContext'
import { Sparkles, CheckCircle2, AlertTriangle, Info, Award, Printer, ShieldAlert } from 'lucide-react'

export default function DrivingCoachPage() {
  const { activeDriverId, activeDriver, dateRange } = useDriver()
  const [coachData, setCoachData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeDriverId) return

    let url = `/api/analytics/coach/${activeDriverId}`
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
        setCoachData(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [activeDriverId, dateRange])

  const handlePrint = () => {
    window.print()
  }

  const summary = coachData?.telemetry_summary || {}
  const totalJourneys = summary.total_journeys ?? 0

  return (
    <div className="page-container printable-page">
      <div className="no-print">
        <TopBar 
          title="AI DRIVING COACH INTELLIGENCE" 
          subtitle="Rule-based transparent safety guidance, actionable recommendations & driver feedback"
        />

        <ActiveDriverSelector showDateFilter={true} className="mb-4" />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={18} /> Export / Print AI Coaching Report
          </button>
        </div>
      </div>

      {loading || !coachData ? (
        <div className="loading-container"><p>GENERATING COACHING RECOMMENDATIONS...</p></div>
      ) : (
        <>
          {/* Insufficient Data State Banner */}
          {totalJourneys === 0 && (
            <div className="alert-banner" style={{ background: 'rgba(59,130,246,0.1)', borderColor: '#3b82f6', color: '#93c5fd', marginBottom: '1.5rem' }}>
              <ShieldAlert size={20} color="#3b82f6" />
              <div>
                <strong>INSUFFICIENT TELEMETRY DATA BASELINE</strong>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  No monitored journey sessions recorded for the selected time range. Complete live webcam or video processing sessions to generate specific telemetry event insights.
                </p>
              </div>
            </div>
          )}

          {/* Coach Header Summary */}
          <div className="coach-hero-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <DriverAvatar driver={{ driver_id: coachData.driver_id, full_name: coachData.driver_name, profile_photo: coachData.profile_photo }} size={72} editable={true} />
            <div className="coach-hero-info">
              <h3>AI COACH INSIGHTS FOR {(coachData.driver_name || 'Driver').toUpperCase()}</h3>
              <p>
                Safety Score Baseline: <strong>{coachData.overall_score}/100</strong> • Level: <strong>{coachData.skill_level} Driver</strong> • Sessions Monitored: <strong>{totalJourneys}</strong>
              </p>
            </div>
          </div>

          {/* Recommendation Cards */}
          <div className="coach-cards-grid" style={{ marginTop: '1.5rem' }}>
            {(coachData.insights || []).map((ins, i) => (
              <div key={i} className={`insight-card insight-${ins.type}`}>
                <div className="insight-card-header">
                  {ins.type === 'positive' && <CheckCircle2 size={20} color="#22c55e" />}
                  {ins.type === 'warning' && <AlertTriangle size={20} color="#ef4444" />}
                  {ins.type === 'info' && <Info size={20} color="#3b82f6" />}
                  <span className="insight-category">{ins.category}</span>
                </div>
                <h4 className="insight-title">{ins.title}</h4>
                <p className="insight-message">{ins.message}</p>
              </div>
            ))}
          </div>

          {/* Action Plan */}
          <CoachingActionPlan actionPlan={coachData.action_plan} driverName={coachData.driver_name} />
        </>
      )}
    </div>
  )
}
