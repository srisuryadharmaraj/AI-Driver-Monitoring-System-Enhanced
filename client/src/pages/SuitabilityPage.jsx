import React, { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { Briefcase, ShieldCheck, AlertCircle, Award, CheckCircle2, FileText } from 'lucide-react'

export default function SuitabilityPage() {
  const [drivers, setDrivers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [suitability, setSuitability] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/drivers')
      .then(r => r.json())
      .then(data => {
        setDrivers(data || [])
        if (data && data.length > 0) {
          setSelectedId(data[0].driver_id)
        }
      })
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    fetch(`/api/recruitment/suitability/${selectedId}`)
      .then(r => r.json())
      .then(data => {
        setSuitability(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedId])

  return (
    <div className="page-container">
      <TopBar 
        title="DRIVER RECRUITMENT & SUITABILITY DASHBOARD" 
        subtitle="Organizational decision-support platform evaluating candidate driver safety & skill profiles"
      />

      {/* Driver Selector Header */}
      <div className="twin-selector-bar">
        <label><Briefcase size={18} color="#3b82f6" /> Select Candidate Driver:</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {drivers.map(d => (
            <option key={d.driver_id} value={d.driver_id}>
              {d.full_name} ({d.driver_id}) — Licence: {d.licence_number}
            </option>
          ))}
        </select>
      </div>

      {loading || !suitability ? (
        <div className="loading-container"><p>EVALUATING CANDIDATE SUITABILITY PROFILE...</p></div>
      ) : (
        <>
          {/* Suitability Result Hero */}
          <div className="suitability-hero-card">
            <div className="suitability-status-icon"><CheckCircle2 size={36} color="#22c55e" /></div>
            <div className="suitability-info">
              <span className="suitability-tag">{suitability.recommendation_level}</span>
              <h3>SUITABILITY INDICATOR: {suitability.suitability_indicator.toUpperCase()}</h3>
              <p>Candidate: <strong>{suitability.full_name}</strong> • Licence: {suitability.licence_type} • Monitored Journeys: {suitability.total_journeys_analysed}</p>
            </div>
            <div className="suitability-score-ring">
              <span className="ssr-num">{Math.round(suitability.safety_score)}</span>
              <span className="ssr-lbl">SAFETY SCORE</span>
            </div>
          </div>

          {/* Metric Matrix */}
          <div className="metric-grid" style={{ marginTop: '1.5rem' }}>
            <div className="card">
              <div className="card-title">EXPERIENCE</div>
              <div className="card-value">{suitability.experience_years} Yrs</div>
            </div>
            <div className="card">
              <div className="card-title">ATTENTION SCORE</div>
              <div className="card-value">{Math.round(suitability.attention_score)}%</div>
            </div>
            <div className="card">
              <div className="card-title">FATIGUE CONTROL</div>
              <div className="card-value">{Math.round(suitability.fatigue_score)}%</div>
            </div>
            <div className="card">
              <div className="card-title">LANE DISCIPLINE</div>
              <div className="card-value">{Math.round(suitability.lane_discipline_score)}%</div>
            </div>
            <div className="card">
              <div className="card-title">CONSISTENCY</div>
              <div className="card-value">{Math.round(suitability.consistency_score)}%</div>
            </div>
          </div>

          {/* Academic / Ethical Disclaimer Box */}
          <div className="disclaimer-alert-box">
            <AlertCircle size={20} color="#3b82f6" />
            <div>
              <strong>ETHICAL DECISION-SUPPORT DISCLAIMER</strong>
              <p>{suitability.disclaimer}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
