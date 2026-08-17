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

        // Apply date range filter client-side if needed
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

  return (
    <div className="page-container">
      <TopBar 
        title="JOURNEY HISTORY & TELEMETRY LOGS" 
        subtitle="Monitored driving sessions, safety scores, and risk event records"
      />

      <ActiveDriverSelector showDateFilter={true} className="mb-4" />

      {loading ? (
        <div className="loading-container"><p>LOADING JOURNEY HISTORY...</p></div>
      ) : journeys.length === 0 ? (
        <div className="empty-state">
          <Route size={48} color="#64748b" />
          <h3>NO JOURNEYS FOUND</h3>
          <p>No journey records match the selected driver and date filter criteria.</p>
        </div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>JOURNEY ID</th>
                <th>DRIVER</th>
                <th>DATE & TIME</th>
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
              {journeys.map(j => (
                <tr key={j.journey_id}>
                  <td><strong>{j.journey_id}</strong></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <DriverAvatar driver={{ driver_id: j.driver_id, full_name: j.driver_name, profile_photo: j.profile_photo }} size={28} editable={false} />
                      <span>{j.driver_name || j.driver_id}</span>
                    </div>
                  </td>
                  <td>{j.date} {j.start_time}</td>
                  <td>
                    <span className={`badge ${j.monitoring_mode === 'Live' ? 'badge-low' : 'badge-medium'}`}>
                      {j.monitoring_mode}
                    </span>
                  </td>
                  <td>{j.duration_min} min</td>
                  <td><span className={j.fatigue_events > 0 ? 'text-amber' : ''}>{j.fatigue_events}</span></td>
                  <td><span className={j.distraction_events > 0 ? 'text-amber' : ''}>{j.distraction_events}</span></td>
                  <td><span>{j.obstacle_warnings + j.overspeed_events}</span></td>
                  <td>
                    <strong style={{ color: j.journey_safety_score >= 85 ? '#22c55e' : j.journey_safety_score >= 70 ? '#f59e0b' : '#ef4444' }}>
                      {Math.round(j.journey_safety_score)}/100
                    </strong>
                  </td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => navigate(`/journey/${j.journey_id}`)}>
                      Detail <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
