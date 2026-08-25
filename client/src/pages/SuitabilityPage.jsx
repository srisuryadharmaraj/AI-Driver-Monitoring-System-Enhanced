import React, { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import ActiveDriverSelector from '../components/ActiveDriverSelector'
import DriverAvatar from '../components/DriverAvatar'
import { useDriver } from '../context/DriverContext'
import { Briefcase, ShieldCheck, AlertCircle, Award, CheckCircle2, FileText, Cpu, ShieldAlert } from 'lucide-react'

export default function SuitabilityPage() {
  const { activeDriverId, activeDriver, activeDriverDetail } = useDriver()
  const [suitability, setSuitability] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeDriverId) return
    setLoading(true)
    fetch(`/api/recruitment/suitability/${activeDriverId}`)
      .then(r => r.json())
      .then(data => {
        setSuitability(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [activeDriverId])

  const getBadgeClass = (level) => {
    const l = (level || '').toLowerCase()
    if (l.includes('highly') || l.includes('recommended')) return 'badge-safe'
    if (l.includes('suitable') || l.includes('good')) return 'badge-info'
    if (l.includes('conditional') || l.includes('moderate')) return 'badge-warning'
    return 'badge-danger'
  }

  return (
    <div className="page-container">
      <TopBar 
        title="SSD DRIVEAI — AI DRIVER SUITABILITY ASSESSMENT" 
        subtitle="Fleet Recruitment Decision-Support System & Candidate Safety Evaluation"
      />

      <ActiveDriverSelector showDateFilter={true} className="mb-4" />

      {loading || !suitability ? (
        <div className="loading-container" style={{ padding: '4rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            EVALUATING CANDIDATE SUITABILITY PROFILE...
          </p>
        </div>
      ) : (
        <>
          {/* Suitability Result Hero Card */}
          <div className="card card-accent-border mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <DriverAvatar driver={activeDriverDetail || activeDriver} size={68} editable={true} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className={`badge ${getBadgeClass(suitability.recommendation_level)}`}>
                    {suitability.recommendation_level?.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)' }}>
                    CANDIDATE RECRUITMENT EVALUATION
                  </span>
                </div>

                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: '0.15rem 0' }}>
                  SUITABILITY INDICATOR: {suitability.suitability_indicator?.toUpperCase()}
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Candidate: <strong>{suitability.full_name}</strong> • Licence: {suitability.licence_type} • Monitored Journeys: {suitability.total_journeys_analysed}
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '1rem 1.5rem', background: 'var(--bg-secondary)', borderRadius: 8, border: '2px solid var(--accent)' }}>
              <span className="telemetry-number-large" style={{ fontSize: '2.8rem', color: Math.round(suitability.safety_score) >= 85 ? 'var(--safe)' : 'var(--warning)', lineHeight: 1 }}>
                {Math.round(suitability.safety_score)}
              </span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', letterSpacing: '0.08em', marginTop: '0.25rem' }}>
                SUITABILITY SAFETY SCORE
              </span>
            </div>
          </div>

          {/* Metric Matrix Grid */}
          <div className="metric-grid mb-4">
            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Experience</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number">{suitability.experience_years}</span>
                <span className="kpi-unit">Years</span>
              </div>
            </div>

            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Attention Score</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number" style={{ color: '#00f0ff' }}>
                  {Math.round(suitability.attention_score)}%
                </span>
              </div>
            </div>

            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Fatigue Control</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number" style={{ color: 'var(--safe)' }}>
                  {Math.round(suitability.fatigue_score)}%
                </span>
              </div>
            </div>

            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Lane Discipline</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number" style={{ color: 'var(--accent-hover)' }}>
                  {Math.round(suitability.lane_discipline_score)}%
                </span>
              </div>
            </div>

            <div className="kpi-card card-accent-border">
              <span className="kpi-title">Consistency</span>
              <div className="kpi-value-wrap">
                <span className="telemetry-number" style={{ color: 'var(--warning)' }}>
                  {Math.round(suitability.consistency_score)}%
                </span>
              </div>
            </div>
          </div>

          {/* Ethical Decision-Support Disclaimer */}
          <div className="card card-accent-border" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.15rem' }}>
            <AlertCircle size={22} color="var(--accent-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', letterSpacing: '0.04em' }}>
                ETHICAL DECISION-SUPPORT DISCLAIMER
              </strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', lineHeight: 1.5 }}>
                {suitability.disclaimer}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
