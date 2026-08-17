import React from 'react'
import TopBar from '../components/TopBar'
import ActiveDriverSelector from '../components/ActiveDriverSelector'
import DriverAvatar from '../components/DriverAvatar'
import { useDriver } from '../context/DriverContext'
import { Cpu, Eye, AlertTriangle, Route, ShieldCheck, RefreshCw, Activity, Award } from 'lucide-react'

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

  return (
    <div className="page-container">
      <TopBar 
        title="PERSONALIZED DRIVER DIGITAL TWIN" 
        subtitle="Evolving Behavioural & Safety Telemetry Profile Model"
      />

      <ActiveDriverSelector showDateFilter={true} className="mb-4" />

      {loading || !driver.driver_id ? (
        <div className="loading-container"><p>SYNCHRONIZING DIGITAL TWIN MODEL...</p></div>
      ) : (
        <>
          {/* Central Digital Driver Core Section */}
          <div className="digital-twin-core-container">
            <div className="core-title-badge">DIGITAL DRIVER CORE LOGIC</div>

            <div className="digital-core-layout">
              {/* Top Node */}
              <div className="twin-node node-top">
                <div className="node-icon"><Eye size={18} color="#3b82f6" /></div>
                <div className="node-val">{attention}%</div>
                <div className="node-lbl">ATTENTION CAPABILITY</div>
              </div>

              {/* Left Node */}
              <div className="twin-node node-left">
                <div className="node-icon"><AlertTriangle size={18} color="#22c55e" /></div>
                <div className="node-val">{fatigue}%</div>
                <div className="node-lbl">FATIGUE MANAGEMENT</div>
              </div>

              {/* Central Core Element */}
              <div className="central-core-orb">
                <div className="core-pulse-ring"></div>
                <div className="core-avatar-box">
                  <DriverAvatar driver={driver} size={70} editable={true} />
                </div>
                <div className="core-score-text">
                  <span className="core-score-num">{safetyScore}</span>
                  <span className="core-score-lbl">{skillLevel.toUpperCase()}</span>
                </div>
              </div>

              {/* Right Node */}
              <div className="twin-node node-right">
                <div className="node-icon"><Route size={18} color="#8b5cf6" /></div>
                <div className="node-val">{lane}%</div>
                <div className="node-lbl">LANE DISCIPLINE</div>
              </div>

              {/* Bottom Node */}
              <div className="twin-node node-bottom">
                <div className="node-icon"><Activity size={18} color="#f59e0b" /></div>
                <div className="node-val">{consistency}%</div>
                <div className="node-lbl">PERFORMANCE CONSISTENCY</div>
              </div>
            </div>
          </div>

          {/* Digital Twin Insights */}
          <div className="profile-two-col" style={{ marginTop: '1.5rem' }}>
            <div className="command-panel">
              <div className="panel-header">
                <h3>RECURRING DANGER PATTERNS</h3>
              </div>
              <ul className="twin-list">
                {(twin.recurring_patterns || ['No critical recurring danger patterns detected.']).map((p, i) => (
                  <li key={i}>❖ {p}</li>
                ))}
              </ul>
            </div>

            <div className="command-panel">
              <div className="panel-header">
                <h3>EVOLVING STRENGTHS & BEHAVIOUR</h3>
              </div>
              <ul className="twin-list green-list">
                {(twin.strengths || ['High forward attention baseline']).map((s, i) => (
                  <li key={i}>✓ {s}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
