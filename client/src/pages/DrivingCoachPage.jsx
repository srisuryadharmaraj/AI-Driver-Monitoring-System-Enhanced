import React, { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import ActiveDriverSelector from '../components/ActiveDriverSelector'
import DriverAvatar from '../components/DriverAvatar'
import CoachingActionPlan from '../components/CoachingActionPlan'
import { useDriver } from '../context/DriverContext'
import { Sparkles, CheckCircle2, AlertTriangle, Info, Award, Printer, ShieldAlert, Target, Shield } from 'lucide-react'

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

  const getPriorityBadge = (type) => {
    if (type === 'warning') return { label: 'HIGH PRIORITY', cls: 'badge-danger' }
    if (type === 'info') return { label: 'MEDIUM PRIORITY', cls: 'badge-warning' }
    return { label: 'LOW PRIORITY', cls: 'badge-safe' }
  }

  return (
    <div className="page-container printable-page">
      <div className="no-print">
        <TopBar 
          title="SSD DRIVEAI — AI PERFORMANCE COACH" 
          subtitle="Transparent Rule-Based Safety Guidance, Actionable Recommendations & Coaching Feedback"
        />

        <ActiveDriverSelector showDateFilter={true} className="mb-4" />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
          <button className="btn btn-primary" onClick={handlePrint} style={{ padding: '0.65rem 1.25rem' }}>
            <Printer size={18} /> EXPORT / PRINT AI COACHING REPORT
          </button>
        </div>
      </div>

      {loading || !coachData ? (
        <div className="loading-container" style={{ padding: '4rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            GENERATING AI COACHING RECOMMENDATIONS...
          </p>
        </div>
      ) : (
        <>
          {/* Insufficient Data State Banner */}
          {totalJourneys === 0 && (
            <div className="card card-accent-border mb-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
              <ShieldAlert size={24} color="#00f0ff" />
              <div>
                <strong style={{ color: '#00f0ff', fontSize: '0.95rem', letterSpacing: '0.04em' }}>INSUFFICIENT TELEMETRY DATA BASELINE</strong>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  No monitored journey sessions recorded for the selected time range. Complete live webcam or video processing sessions to generate specific telemetry event insights.
                </p>
              </div>
            </div>
          )}

          {/* Coach Hero Card */}
          <div className="card card-accent-border mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <DriverAvatar driver={{ driver_id: coachData.driver_id, full_name: coachData.driver_name, profile_photo: coachData.profile_photo }} size={64} editable={true} />
              <div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)', fontWeight: 700 }}>
                  DRIVER PERFORMANCE ENGINE
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: '0.15rem 0' }}>
                  AI COACH INSIGHTS FOR {(coachData.driver_name || 'Driver').toUpperCase()}
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Safety Baseline: <strong>{coachData.overall_score}/100</strong> • Level: <strong>{coachData.skill_level} Driver</strong> • Sessions Monitored: <strong>{totalJourneys}</strong>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge badge-info" style={{ padding: '0.5rem 0.85rem', fontSize: '0.78rem' }}>
                <Sparkles size={14} /> ACTIVE AI COACHING ENGINE
              </span>
            </div>
          </div>

          {/* Recommendation Cards */}
          <div className="section-header-row mb-3">
            <h3 className="section-title">TARGETED SAFETY RECOMMENDATIONS ({coachData.insights?.length || 0})</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {(coachData.insights || []).map((ins, i) => {
              const priority = getPriorityBadge(ins.type)
              return (
                <div key={i} className="card card-accent-border" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.85rem', padding: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-secondary)' }}>
                        {ins.category}
                      </span>
                      <span className={`badge ${priority.cls}`}>
                        {priority.label}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.35rem' }}>
                      {ins.title}
                    </h4>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {ins.message}
                    </p>
                  </div>

                  <div style={{ paddingTop: '0.6rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>AI Observation Verified</span>
                    <span style={{ color: 'var(--safe)', fontWeight: 700 }}>Target Improvement Active</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action Plan */}
          <CoachingActionPlan actionPlan={coachData.action_plan} driverName={coachData.driver_name} />
        </>
      )}
    </div>
  )
}
