import React from 'react'
import TopBar from '../components/TopBar'
import ActiveDriverSelector from '../components/ActiveDriverSelector'
import DriverAvatar from '../components/DriverAvatar'
import SkillRadarChart from '../components/SkillRadarChart'
import SafetyScoreGauge from '../components/SafetyScoreGauge'
import { useDriver } from '../context/DriverContext'
import { Cpu, Eye, AlertTriangle, Route, ShieldCheck, RefreshCw, Activity, Award, CheckCircle2, AlertCircle } from 'lucide-react'

export default function DigitalTwinPage() {
  const { activeDriverDetail, loading } = useDriver()

  const driver = activeDriverDetail || {}
  const twin = driver?.digital_twin || {}
  const summary = driver?.telemetry_summary || {}

  const attention = Math.round(twin.attention_score || 90)
  const fatigue = Math.round(twin.fatigue_score || 85)
  const lane = Math.round(twin.lane_score || 88)
  const consistency = Math.round(twin.consistency_score || 87)
  const skillLevel = twin.skill_level || 'Advanced'
  const safetyScore = Math.round(summary.avg_safety_score ?? twin.historical_safety_score ?? 88)

  const scoreData = {
    score: safetyScore,
    rating: safetyScore >= 90 ? 'Excellent' : safetyScore >= 80 ? 'Good' : 'Needs Focus',
    factors: [
      { name: 'Attention Management', score: Math.round((twin.attention_score || 85) * 0.25), max: 25 },
      { name: 'Lane Discipline', score: Math.round((twin.lane_score || 85) * 0.25), max: 25 },
      { name: 'Fatigue Control', score: Math.round((twin.fatigue_score || 85) * 0.25), max: 25 },
      { name: 'Risk Management', score: Math.round((twin.risk_control_score || 85) * 0.25), max: 25 },
    ]
  }

  return (
    <div className="page-container">
      <TopBar 
        title="SSD DRIVEAI — DRIVER DIGITAL TWIN" 
        subtitle="Evolving Behavioral, Attentiveness & Safety Telemetry Intelligence Model"
      />

      <ActiveDriverSelector showDateFilter={true} className="mb-4" />

      {loading || !driver.driver_id ? (
        <div className="loading-container" style={{ padding: '4rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            SYNCHRONIZING DRIVER DIGITAL TWIN MODEL...
          </p>
        </div>
      ) : (
        <>
          {/* Central Digital Driver Core Dashboard */}
          <div className="card mb-4" style={{ padding: '1.5rem', background: 'linear-gradient(180deg, var(--surface) 0%, rgba(15, 20, 31, 0.9) 100%)', border: '1px solid var(--border-accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu size={18} color="#00f0ff" />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  DIGITAL DRIVER TELEMETRY CORE
                </h3>
              </div>
              <span className="badge badge-info">
                Model Status: ACTIVE SYNCHRONIZED
              </span>
            </div>

            {/* Core Telemetry Node Cluster */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="kpi-card card-accent-border">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <Eye size={16} color="#00f0ff" />
                  <span className="kpi-title">ATTENTION CAPABILITY</span>
                </div>
                <div className="kpi-value-wrap">
                  <span className="telemetry-number" style={{ color: '#00f0ff' }}>{attention}%</span>
                </div>
              </div>

              <div className="kpi-card card-accent-border">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <AlertTriangle size={16} color="#00e676" />
                  <span className="kpi-title">FATIGUE MANAGEMENT</span>
                </div>
                <div className="kpi-value-wrap">
                  <span className="telemetry-number" style={{ color: '#00e676' }}>{fatigue}%</span>
                </div>
              </div>

              <div className="kpi-card card-accent-border">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <Route size={16} color="#7000ff" />
                  <span className="kpi-title">LANE DISCIPLINE</span>
                </div>
                <div className="kpi-value-wrap">
                  <span className="telemetry-number" style={{ color: '#0066ff' }}>{lane}%</span>
                </div>
              </div>

              <div className="kpi-card card-accent-border">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <Activity size={16} color="#ffb300" />
                  <span className="kpi-title">PERFORMANCE CONSISTENCY</span>
                </div>
                <div className="kpi-value-wrap">
                  <span className="telemetry-number" style={{ color: '#ffb300' }}>{consistency}%</span>
                </div>
              </div>
            </div>

            {/* Central Identity Hero Strip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <DriverAvatar driver={driver} size={64} editable={true} />
                <div>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)', fontWeight: 700 }}>
                    {driver.driver_id}
                  </div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: '0.15rem 0' }}>
                    {driver.full_name}
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Licence: {driver.licence_number} ({driver.licence_type}) • {driver.years_of_experience} Yrs Exp
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                    DIGITAL TWIN SAFETY INDEX
                  </span>
                  <span className="telemetry-number-large" style={{ fontSize: '2.5rem', color: '#ffffff', lineHeight: 1 }}>
                    {safetyScore}
                  </span>
                </div>
                <span className="skill-badge" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  <Award size={15} /> {skillLevel} Driver
                </span>
              </div>
            </div>
          </div>

          {/* Skill Radar & Explainable AI Breakdown */}
          <div className="profile-two-col">
            <div className="command-panel">
              <div className="panel-header">
                <h3><Award size={18} color="var(--accent)" /> SKILL RADAR MATRIX</h3>
              </div>
              <SkillRadarChart twin={twin} />
            </div>

            <SafetyScoreGauge scoreData={scoreData} />
          </div>

          {/* Recurring Danger Patterns & Evolving Strengths */}
          <div className="profile-insights-row" style={{ marginTop: '1.5rem' }}>
            <div className="insight-box">
              <h4 style={{ color: 'var(--warning)' }}><AlertCircle size={18} /> RECURRING DANGER PATTERNS</h4>
              <ul>
                {(twin.recurring_patterns || ['No critical recurring danger patterns detected.']).map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>

            <div className="insight-box">
              <h4 style={{ color: 'var(--safe)' }}><CheckCircle2 size={18} /> EVOLVING STRENGTHS &amp; BEHAVIOR</h4>
              <ul>
                {(twin.strengths || ['High forward attention baseline', 'Consistent speed regulation']).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
