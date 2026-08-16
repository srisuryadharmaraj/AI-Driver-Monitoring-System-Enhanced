import React, { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import SkillRadarChart from '../components/SkillRadarChart'
import { Users, Award, Shield, CheckCircle, ArrowRightLeft } from 'lucide-react'

export default function DriverComparisonPage() {
  const [allDrivers, setAllDrivers] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [comparison, setComparison] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/drivers')
      .then(r => r.json())
      .then(data => {
        setAllDrivers(data || [])
        if (data && data.length >= 2) {
          const defaultPair = [data[0].driver_id, data[1].driver_id]
          setSelectedIds(defaultPair)
        }
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (selectedIds.length < 2) return
    fetch(`/api/recruitment/compare?ids=${selectedIds.join(',')}`)
      .then(r => r.json())
      .then(data => setComparison(data || []))
  }, [selectedIds])

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 2) {
        setSelectedIds(selectedIds.filter(i => i !== id))
      }
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds([...selectedIds, id])
      }
    }
  }

  return (
    <div className="page-container">
      <TopBar 
        title="ADVANCED DRIVER COMPARISON MATRIX" 
        subtitle="Side-by-side multi-driver telemetry comparison tool (Select 2-4 Drivers)"
      />

      {/* Driver Selection Pills */}
      <div className="comparison-selector-box">
        <label><ArrowRightLeft size={18} color="#3b82f6" /> Select Drivers to Compare:</label>
        <div className="driver-pill-group">
          {allDrivers.map(d => {
            const active = selectedIds.includes(d.driver_id)
            return (
              <button 
                key={d.driver_id} 
                className={`driver-select-pill ${active ? 'pill-active' : ''}`}
                onClick={() => toggleSelect(d.driver_id)}
              >
                {active && <CheckCircle size={14} />}
                <span>{d.full_name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><p>LOADING DRIVER TELEMETRY COMPARISON...</p></div>
      ) : (
        <div className="comparison-grid" style={{ gridTemplateColumns: `repeat(${comparison.length}, 1fr)` }}>
          {comparison.map(drv => {
            const twin = drv.digital_twin || {}
            return (
              <div key={drv.driver_id} className="comparison-column-card">
                <div className="comp-card-header">
                  <img src={drv.profile_photo || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + drv.driver_id} alt="" className="comp-avatar" />
                  <h4>{drv.full_name}</h4>
                  <p>{drv.driver_id} • {drv.years_of_experience} yrs exp</p>
                  <span className={`skill-badge level-${(twin.skill_level || 'Advanced').toLowerCase()}`}>
                    {twin.skill_level}
                  </span>
                </div>

                <div className="comp-big-score-box">
                  <span className="comp-score-num">{Math.round(twin.historical_safety_score || 85)}</span>
                  <span className="comp-score-lbl">OVERALL SAFETY SCORE</span>
                </div>

                <SkillRadarChart twin={twin} />

                <div className="comp-stats-list">
                  <div className="comp-stat-row">
                    <span>Attention Score</span>
                    <strong>{Math.round(twin.attention_score || 85)}%</strong>
                  </div>
                  <div className="comp-stat-row">
                    <span>Fatigue Control</span>
                    <strong>{Math.round(twin.fatigue_score || 85)}%</strong>
                  </div>
                  <div className="comp-stat-row">
                    <span>Lane Discipline</span>
                    <strong>{Math.round(twin.lane_score || 85)}%</strong>
                  </div>
                  <div className="comp-stat-row">
                    <span>Consistency</span>
                    <strong>{Math.round(twin.consistency_score || 85)}%</strong>
                  </div>
                  <div className="comp-stat-row">
                    <span>Total Journeys</span>
                    <strong>{twin.total_journeys || 0}</strong>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
