import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import ActiveDriverSelector from '../components/ActiveDriverSelector'
import DriverAvatar from '../components/DriverAvatar'
import { useDriver } from '../context/DriverContext'
import { Route, Clock, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react'

export default function JourneysPage() {
  const navigate = useNavigate()
  const { activeDriverId, dateRange } = useDriver()
  const [journeys, setJourneys] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let url = '/api/journeys'
    if (activeDriverId) {
      url += `?driver_id=${activeDriverId}`
    }

    setLoading(true)
    fetch(url)
      .then(r => r.json())
      .then(data => {
        let list = data || []

        if (dateRange.preset !== 'all') {
          let startDate = null
          let endDate = null

          if (dateRange.preset === 'custom') {
            startDate = dateRange.fromDate ? new Date(dateRange.fromDate) : null
            endDate = dateRange.toDate ? new Date(dateRange.toDate) : null
          } else {
            const days = dateRange.preset === '7d' ? 7 : dateRange.preset === '30d' ? 30 : 90
            endDate = new Date()
            startDate = new Date()
            startDate.setDate(endDate.getDate() - days)
          }

          list = list.filter(j => {
            if (!j.date) return true
            const d = new Date(j.date)
            if (startDate && d < startDate) return false
            if (endDate && d > endDate) return false
            return true
          })
        }

        setJourneys(list)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [activeDriverId, dateRange])

  const getScoreBadge = (score) => {
    const val = Math.round(score)
    if (val >= 90) return { label: 'SAFE', cls: 'badge-safe', color: 'var(--safe)' }
    if (val >= 75) return { label: 'GOOD', cls: 'badge-info', color: 'var(--accent-hover)' }
    if (val >= 60) return { label: 'CAUTION', cls: 'badge-warning', color: 'var(--warning)' }
    return { label: 'HIGH RISK', cls: 'badge-danger', color: 'var(--danger)' }
  }

  return (
    <div className="page-container">
      <TopBar 
        title="SSD DRIVEAI — DRIVE SESSION TELEMETRY ARCHIVE" 
        subtitle="Monitored Driving Sessions, Safety Scores, and Risk Event Telemetry Logs"
      />

      <ActiveDriverSelector showDateFilter={true} className="mb-4" />

      {loading ? (
        <div className="loading-container" style={{ padding: '4rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            LOADING JOURNEY TELEMETRY ARCHIVE...
          </p>
        </div>
      ) : journeys.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Route size={44} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>NO TELEMETRY JOURNEYS FOUND</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            No journey records match the selected driver and date filter criteria.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>JOURNEY ID</th>
                <th>DRIVER</th>
                <th>DATE &amp; TIME</th>
                <th>MODE</th>
                <th>DURATION</th>
                <th>FATIGUE</th>
                <th>DISTRACTION</th>
                <th>HAZARDS</th>
                <th>SAFETY SCORE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {journeys.map((j, idx) => {
                const scoreInfo = getScoreBadge(j.journey_safety_score)
                const isLatest = idx === 0
                return (
                  <tr key={j.journey_id} className={isLatest ? 'latest-journey-row' : ''}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--accent-secondary)' }}>
                      {j.journey_id}
                      {isLatest && <span className="badge badge-info" style={{ marginLeft: '0.5rem', fontSize: '0.62rem' }}>LATEST</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <DriverAvatar driver={{ driver_id: j.driver_id, full_name: j.driver_name, profile_photo: j.profile_photo }} size={28} editable={false} />
                        <span style={{ fontWeight: 600 }}>{j.driver_name || j.driver_id}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {j.date} {j.start_time}
                    </td>
                    <td>
                      <span className={`badge ${j.monitoring_mode === 'Live' ? 'badge-safe' : 'badge-info'}`}>
                        {j.monitoring_mode}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{j.duration_min} min</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: j.fatigue_events > 0 ? 'var(--warning)' : 'inherit', fontWeight: j.fatigue_events > 0 ? 700 : 400 }}>
                        {j.fatigue_events}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: j.distraction_events > 0 ? 'var(--warning)' : 'inherit', fontWeight: j.distraction_events > 0 ? 700 : 400 }}>
                        {j.distraction_events}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: (j.obstacle_warnings + j.overspeed_events) > 0 ? 'var(--danger)' : 'inherit', fontWeight: (j.obstacle_warnings + j.overspeed_events) > 0 ? 700 : 400 }}>
                        {j.obstacle_warnings + j.overspeed_events}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: scoreInfo.color, fontSize: '0.95rem' }}>
                          {Math.round(j.journey_safety_score)}
                        </span>
                        <span className={`badge ${scoreInfo.cls}`}>
                          {scoreInfo.label}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }} onClick={() => navigate(`/journey/${j.journey_id}`)}>
                        Detail <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
