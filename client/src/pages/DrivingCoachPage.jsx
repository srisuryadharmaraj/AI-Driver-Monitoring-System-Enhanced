import React, { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { Sparkles, CheckCircle2, AlertTriangle, Info, Award } from 'lucide-react'

export default function DrivingCoachPage() {
  const [drivers, setDrivers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [coachData, setCoachData] = useState(null)
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
    fetch(`/api/analytics/coach/${selectedId}`)
      .then(r => r.json())
      .then(data => {
        setCoachData(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedId])

  return (
    <div className="page-container">
      <TopBar 
        title="AI DRIVING COACH INTELLIGENCE" 
        subtitle="Rule-based transparent safety guidance, actionable recommendations & driver feedback"
      />

      {/* Driver Selector Header */}
      <div className="twin-selector-bar">
        <label><Sparkles size={18} color="#3b82f6" /> Select Driver for Coaching Insights:</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {drivers.map(d => (
            <option key={d.driver_id} value={d.driver_id}>
              {d.full_name} ({d.driver_id}) — Level: {d.digital_twin?.skill_level || 'Advanced'}
            </option>
          ))}
        </select>
      </div>

      {loading || !coachData ? (
        <div className="loading-container"><p>GENERATING COACHING RECOMMENDATIONS...</p></div>
      ) : (
        <>
          {/* Coach Header Summary */}
          <div className="coach-hero-card">
            <div className="coach-sparkle-icon"><Sparkles size={32} color="#3b82f6" /></div>
            <div className="coach-hero-info">
              <h3>AI COACH INSIGHTS FOR {coachData.driver_name.toUpperCase()}</h3>
              <p>Safety Score Baseline: <strong>{coachData.overall_score}/100</strong> • Status: <strong>{coachData.skill_level} Driver</strong></p>
            </div>
          </div>

          {/* Recommendation Cards */}
          <div className="coach-cards-grid">
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
        </>
      )}
    </div>
  )
}
