import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import DriverAvatar from '../components/DriverAvatar'
import { Award, Users, Shield, AlertTriangle, ChevronRight, Trophy, Cpu, Activity, ShieldCheck } from 'lucide-react'

export default function FleetDashboardPage() {
  const navigate = useNavigate()
  const [leaderboard, setLeaderboard] = useState([])
  const [category, setCategory] = useState('safety')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/analytics/leaderboard?category=${category}`)
      .then(r => r.json())
      .then(data => {
        setLeaderboard(data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [category])

  const totalDrivers = leaderboard.length
  const avgSafetyScore = leaderboard.length > 0 
    ? Math.round(leaderboard.reduce((acc, d) => acc + (d.historical_safety_score || 85), 0) / leaderboard.length) 
    : 88

  return (
    <div className="page-container">
      <TopBar 
        title="SSD DRIVEAI — FLEET OPERATIONS INTELLIGENCE" 
        subtitle="Executive Fleet Operations Console, Driver Safety Rankings & Risk Distribution"
      />

      {/* Fleet KPI Summary Row */}
      <div className="metric-grid mb-4">
        <div className="kpi-card card-accent-border">
          <span className="kpi-title">Registered Fleet Drivers</span>
          <div className="kpi-value-wrap">
            <span className="telemetry-number">{totalDrivers}</span>
            <span className="kpi-unit">Drivers</span>
          </div>
        </div>

        <div className="kpi-card card-accent-border">
          <span className="kpi-title">Fleet Avg Safety Score</span>
          <div className="kpi-value-wrap">
            <span className="telemetry-number" style={{ color: avgSafetyScore >= 85 ? 'var(--safe)' : 'var(--warning)' }}>
              {avgSafetyScore}
            </span>
            <span className="kpi-unit">/ 100</span>
          </div>
        </div>

        <div className="kpi-card card-accent-border">
          <span className="kpi-title">Active Category Focus</span>
          <div className="kpi-value-wrap">
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-secondary)', textTransform: 'uppercase' }}>
              {category}
            </span>
          </div>
        </div>

        <div className="kpi-card card-accent-border">
          <span className="kpi-title">Fleet Telemetry Status</span>
          <div className="kpi-value-wrap">
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--safe)' }}>
              ONLINE ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Toolbar */}
      <div className="card mb-4" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
          <Trophy size={16} color="var(--warning)" /> RANKING CATEGORY:
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${category === 'safety' ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setCategory('safety')}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
          >
            Highest Safety
          </button>
          <button 
            className={`btn ${category === 'attention' ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setCategory('attention')}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
          >
            Best Attention
          </button>
          <button 
            className={`btn ${category === 'lane' ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setCategory('lane')}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
          >
            Best Lane Discipline
          </button>
          <button 
            className={`btn ${category === 'consistency' ? 'btn-primary' : 'btn-secondary'}`} 
            onClick={() => setCategory('consistency')}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
          >
            Most Consistent
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container" style={{ padding: '4rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            LOADING DRIVER LEADERBOARD &amp; TELEMETRY...
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>DRIVER</th>
                <th>LICENCE / EXP</th>
                <th>SKILL LEVEL</th>
                <th>SAFETY SCORE</th>
                <th>ATTENTION</th>
                <th>FATIGUE MGMT</th>
                <th>LANE DISCIPLINE</th>
                <th>CONSISTENCY</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((d, index) => (
                <tr key={d.driver_id}>
                  <td>
                    <span className={`badge ${index === 0 ? 'badge-warning' : index === 1 ? 'badge-info' : index === 2 ? 'badge-safe' : 'badge-secondary'}`} style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                      #{index + 1}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <DriverAvatar driver={{ driver_id: d.driver_id, full_name: d.full_name, profile_photo: d.profile_photo }} size={32} editable={false} />
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.88rem' }}>{d.full_name}</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{d.driver_id}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{d.years_of_experience} yrs exp</td>
                  <td>
                    <span className="skill-badge">
                      {d.skill_level || 'Advanced'}
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: (d.historical_safety_score || 85) >= 85 ? 'var(--safe)' : 'var(--warning)' }}>
                      {Math.round(d.historical_safety_score)}/100
                    </strong>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(d.attention_score)}%</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(d.fatigue_score)}%</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(d.lane_score)}%</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(d.consistency_score)}%</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }} onClick={() => navigate(`/driver/${d.driver_id}`)}>
                      Profile <ChevronRight size={14} />
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
