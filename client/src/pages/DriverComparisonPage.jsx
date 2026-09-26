import React, { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import SkillRadarChart from '../components/SkillRadarChart'
import DriverAvatar from '../components/DriverAvatar'
import AvailabilityBadge from '../components/AvailabilityBadge'
import { Users, Award, Shield, CheckCircle, ArrowRightLeft, Cpu } from 'lucide-react'

export default function DriverComparisonPage() {
  const [allDrivers, setAllDrivers] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [comparison, setComparison] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(true)

  useEffect(() => {
    fetch('/api/drivers')
      .then(r => r.json())
      .then(data => {
        const driversList = data || []
        setAllDrivers(driversList)
        
        const availableDrivers = driversList.filter(d => (d.availability || 'Available') === 'Available')
        const initialList = availableDrivers.length >= 2 ? availableDrivers : driversList
        if (initialList.length >= 2) {
          setSelectedIds([initialList[0].driver_id, initialList[1].driver_id])
        }
        setLoading(false)
      })
  }, [])

  const displayedDrivers = filterAvailableOnly 
    ? allDrivers.filter(d => (d.availability || 'Available') === 'Available')
    : allDrivers

  // Sync selectedIds when availability filter changes if selected drivers are filtered out
  useEffect(() => {
    if (!filterAvailableOnly || displayedDrivers.length === 0) return
    const validSelected = selectedIds.filter(id => displayedDrivers.some(d => d.driver_id === id))
    if (validSelected.length < 2) {
      const candidates = displayedDrivers.map(d => d.driver_id)
      if (candidates.length >= 2) {
        setSelectedIds(candidates.slice(0, Math.min(4, candidates.length)))
      } else if (candidates.length === 1) {
        setSelectedIds(candidates)
      }
    } else if (validSelected.length !== selectedIds.length) {
      setSelectedIds(validSelected)
    }
  }, [filterAvailableOnly, allDrivers])

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
        title="SSD DRIVEAI — DRIVER PERFORMANCE BENCHMARK LAB" 
        subtitle="Side-by-Side Telemetry Benchmark & Multi-Driver Skill Matrix (Select 2–4 Drivers)"
      />

      {/* Driver Selection & Availability Controls */}
      <div className="card mb-4" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
            <ArrowRightLeft size={16} /> SELECT FLEET DRIVERS TO BENCHMARK:
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Availability:</span>
            <button 
              className={`preset-pill ${filterAvailableOnly ? 'active' : ''}`}
              onClick={() => setFilterAvailableOnly(true)}
              style={{ height: 28, padding: '0.2rem 0.65rem', fontSize: '0.72rem' }}
            >
              Available Drivers Only
            </button>
            <button 
              className={`preset-pill ${!filterAvailableOnly ? 'active' : ''}`}
              onClick={() => setFilterAvailableOnly(false)}
              style={{ height: 28, padding: '0.2rem 0.65rem', fontSize: '0.72rem' }}
            >
              All Drivers
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {displayedDrivers.map(d => {
            const active = selectedIds.includes(d.driver_id)
            return (
              <button 
                key={d.driver_id} 
                className={`preset-pill ${active ? 'active' : ''}`}
                onClick={() => toggleSelect(d.driver_id)}
                style={{ height: 36, padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {active && <CheckCircle size={14} />}
                <span>{d.full_name} ({d.driver_id})</span>
                <AvailabilityBadge status={d.availability || 'Available'} style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }} />
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="loading-container" style={{ padding: '4rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            LOADING DRIVER TELEMETRY BENCHMARK...
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${comparison.length}, 1fr)`, gap: '1.25rem' }}>
          {comparison.map(drv => {
            const twin = drv.digital_twin || {}
            const safetyScore = Math.round(twin.historical_safety_score || 85)

            return (
              <div key={drv.driver_id} className="card card-accent-border" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <DriverAvatar driver={{ driver_id: drv.driver_id, full_name: drv.full_name, profile_photo: drv.profile_photo }} size={64} editable={false} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: '0.5rem 0 0.15rem 0' }}>{drv.full_name}</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {drv.driver_id} • {drv.years_of_experience} yrs exp
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span className="skill-badge">
                      <Award size={13} /> {twin.skill_level || 'Advanced'}
                    </span>
                    <AvailabilityBadge status={drv.availability || 'Available'} />
                  </div>
                </div>

                <div style={{ textAlign: 'center', padding: '0.85rem', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <span className="telemetry-number-large" style={{ fontSize: '2.5rem', color: safetyScore >= 85 ? 'var(--safe)' : 'var(--warning)', lineHeight: 1 }}>
                    {safetyScore}
                  </span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', letterSpacing: '0.08em', marginTop: '0.25rem' }}>
                    OVERALL SAFETY SCORE
                  </span>
                </div>

                <SkillRadarChart twin={twin} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Attention Score</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)' }}>{Math.round(twin.attention_score || 85)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Fatigue Control</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--safe)' }}>{Math.round(twin.fatigue_score || 85)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Lane Discipline</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-hover)' }}>{Math.round(twin.lane_score || 85)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Consistency</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>{Math.round(twin.consistency_score || 85)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Journeys</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{twin.total_journeys || 0}</strong>
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
