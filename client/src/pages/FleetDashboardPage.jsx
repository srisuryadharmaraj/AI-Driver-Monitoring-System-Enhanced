import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { Award, Users, Shield, AlertTriangle, ChevronRight, Trophy } from 'lucide-react'

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

  return (
    <div className="page-container">
      <TopBar 
        title="FLEET INTELLIGENCE & ORGANISATION DASHBOARD" 
        subtitle="Executive management overview of driver performance, safety ranking & risk distribution"
      />

      <div className="toolbar-row">
        <div className="filter-buttons">
          <button className={`btn ${category === 'safety' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCategory('safety')}>
            Highest Safety
          </button>
          <button className={`btn ${category === 'attention' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCategory('attention')}>
            Best Attention
          </button>
          <button className={`btn ${category === 'lane' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCategory('lane')}>
            Best Lane Discipline
          </button>
          <button className={`btn ${category === 'consistency' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCategory('consistency')}>
            Most Consistent
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><p>LOADING LEADERBOARD & FLEET TELEMETRY...</p></div>
      ) : (
        <div className="table-card">
          <div className="panel-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155' }}>
            <h3><Trophy size={18} color="#f59e0b" /> PROFESSIONAL DRIVER LEADERBOARD</h3>
          </div>
          <table className="data-table">
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
                    <span className={`rank-badge rank-${index + 1}`}>#{index + 1}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <img src={d.profile_photo || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + d.driver_id} width={32} height={32} style={{ borderRadius: '50%' }} alt="" />
                      <div>
                        <strong>{d.full_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{d.driver_id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{d.years_of_experience} yrs exp</td>
                  <td>
                    <span className={`skill-badge level-${(d.skill_level || 'Advanced').toLowerCase()}`}>
                      {d.skill_level}
                    </span>
                  </td>
                  <td><strong style={{ color: '#22c55e' }}>{Math.round(d.historical_safety_score)}/100</strong></td>
                  <td>{Math.round(d.attention_score)}%</td>
                  <td>{Math.round(d.fatigue_score)}%</td>
                  <td>{Math.round(d.lane_score)}%</td>
                  <td>{Math.round(d.consistency_score)}%</td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => navigate(`/driver/${d.driver_id}`)}>
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
