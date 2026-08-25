import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, Square, AlertTriangle, ShieldAlert, Activity, UserCheck } from 'lucide-react'
import RiskGauge from './RiskGauge'
import TimelineChart from './TimelineChart'
import useAlarm from '../hooks/useAlarm'
import { useDriver } from '../context/DriverContext'

export default function LiveMode({ settings }) {
  const { activeDriver, activeDriverId, refreshDrivers } = useDriver()
  const [running, setRunning] = useState(false)
  const [frame, setFrame] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState('')
  const wsRef = useRef(null)
  const playAlarm = useAlarm()

  const start = useCallback(() => {
    if (!activeDriverId || !activeDriver) {
      setError('Please select a driver before starting monitoring.')
      setRunning(false)
      return
    }

    setError('')
    setRunning(true)
    setMetrics(null)

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = window.location.host
    const wsUrl = `${proto}://${host}/ws/live?speed_limit=${settings.speedLimit}&ear_threshold=${settings.earThreshold}&driver_id=${activeDriverId}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data)
      if (msg.error) {
        setError(msg.error)
        setRunning(false)
        return
      }
      if (msg.image) {
        setFrame(`data:image/jpeg;base64,${msg.image}`)
      }
      setMetrics(msg)
      // Play alarm sound in browser
      if (msg.alarm) playAlarm()
    }

    ws.onerror = () => {
      setError('WebSocket connection failed. Is the server running?')
      setRunning(false)
    }

    ws.onclose = () => {
      setRunning(false)
      if (refreshDrivers) refreshDrivers()
    }
  }, [settings, playAlarm, activeDriverId, activeDriver, refreshDrivers])

  const stop = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'stop' }))
    }
    setRunning(false)
    if (refreshDrivers) refreshDrivers()
  }, [refreshDrivers])

  useEffect(() => {
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'stop' }))
        wsRef.current.close()
      }
    }
  }, [])

  const alarmActive = running && metrics?.alarm

  return (
    <div>
      <div className="page-header">
        <h1>📹 Live Camera Monitor</h1>
        <p>Real-time driver behaviour &amp; obstacle monitoring with continuous alarm system.</p>
      </div>

      {/* Active Driver Badge */}
      <div className="chart-card mb-4" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #22c55e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img 
            src={activeDriver?.profile_photo || "https://api.dicebear.com/7.x/bottts/svg?seed=driver"} 
            alt={activeDriver?.full_name} 
            style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid #334155', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <UserCheck size={13} color="#22c55e" /> MONITORING SESSION DRIVER
            </div>
            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
              {activeDriver ? activeDriver.full_name : <span style={{ color: '#ef4444' }}>No Driver Selected</span>}
              {activeDriver && <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '0.5rem', fontFamily: 'monospace' }}>({activeDriver.driver_id})</span>}
            </div>
          </div>
        </div>
        <span className={`badge ${activeDriver ? 'badge-success' : 'badge-danger'}`}>
          {activeDriver ? activeDriver.licence_type || 'Commercial' : 'Action Required'}
        </span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={start} disabled={running}>
          <Camera size={16} /> Start Camera
        </button>
        <button className="btn btn-danger" onClick={stop} disabled={!running}>
          <Square size={16} /> Stop Camera
        </button>
        {running && (
          <span className="monitoring-badge">
            <Activity size={14} /> Continuous Monitoring Active
          </span>
        )}
      </div>

      {error && (
        <div className="alert-banner"><AlertTriangle size={18} /> {error}</div>
      )}

      {/* Alarm Banner */}
      {alarmActive && (
        <div className="alarm-banner">
          <ShieldAlert size={20} />
          <div>
            <strong>ALARM — Unsafe Behaviour Detected!</strong>
            <div className="alarm-reasons">
              {(metrics.alarm_reasons || []).map((r, i) => <span key={i}>• {r}</span>)}
            </div>
          </div>
        </div>
      )}

      {/* Live View + Sidebar */}
      <div className="live-grid">
        {/* Video Feed */}
        <div>
          <div className={`video-frame ${alarmActive ? 'frame-alarm' : ''}`}>
            {frame ? (
              <img src={frame} alt="Live feed" />
            ) : (
              <span className="placeholder-text">
                {running ? 'Connecting…' : 'Camera not active'}
              </span>
            )}
          </div>

          {/* Rolling Charts */}
          {metrics && running && (
            <>
              <div className="chart-grid">
                <TimelineChart data={metrics.speed_history || []} title="Speed" yLabel="km/h" dangerLine={settings.speedLimit} color="#3b82f6" />
                <TimelineChart data={metrics.risk_history || []} title="Risk Score" yLabel="Score" dangerLine={0.6} color="#f59e0b" />
              </div>
              <div className="chart-grid">
                <TimelineChart data={metrics.ear_history || []} title="EAR" yLabel="EAR" dangerLine={settings.earThreshold} color="#22c55e" />
                <TimelineChart data={metrics.danger_history || []} title="Collision Danger" yLabel="Danger" dangerLine={0.5} color="#ef4444" />
              </div>
            </>
          )}
        </div>

        {/* Metrics Sidebar */}
        <div className="live-sidebar-panel">
          <div className="card">
            <RiskGauge score={metrics?.risk_score ?? 0} size={180} />
          </div>

          <div className="card">
            <div className="card-title">Speed</div>
            <div className="card-value" style={{ color: (metrics?.speed_kmph ?? 0) > settings.speedLimit ? '#ef4444' : '#22c55e' }}>
              {(metrics?.speed_kmph ?? 0).toFixed(0)} <small>km/h</small>
            </div>
          </div>

          <div className="card">
            <div className="card-title">EAR</div>
            <div className="card-value">{(metrics?.ear ?? 0).toFixed(2)}</div>
          </div>

          <div className="card">
            <div className="card-title">Fatigue</div>
            <div className="card-value" style={{ color: metrics?.fatigue ? '#ef4444' : '#22c55e' }}>
              {metrics?.fatigue ? '😴 YES' : '✅ No'}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Distracted</div>
            <div className="card-value" style={{ color: metrics?.distraction ? '#ef4444' : '#22c55e' }}>
              {metrics?.distraction ? '⚠️ YES' : '✅ No'}
            </div>
          </div>

          <div className={`card ${metrics?.collision_risk ? 'card-danger' : ''}`}>
            <div className="card-title">Collision Risk</div>
            <div className="card-value" style={{ color: metrics?.collision_risk ? '#ef4444' : '#22c55e' }}>
              {metrics?.collision_risk ? '🚨 YES' : '✅ No'}
            </div>
            {metrics?.obstacle_detected && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {metrics.obstacle_count} obstacle{metrics.obstacle_count !== 1 ? 's' : ''} — {metrics.obstacle_label}
                {metrics.approaching && <span style={{ color: '#ef4444' }}> (approaching)</span>}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Danger Score</div>
            <div className="card-value" style={{ color: (metrics?.danger_score ?? 0) > 0.5 ? '#ef4444' : '#22c55e' }}>
              {((metrics?.danger_score ?? 0) * 100).toFixed(0)}%
            </div>
          </div>

          <div className="card">
            <div className="card-title">Head Pose</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Yaw: {(metrics?.yaw ?? 0).toFixed(0)}° &nbsp;
              Pitch: {(metrics?.pitch ?? 0).toFixed(0)}°
            </div>
          </div>

          <div className="card">
            <div className="card-title">Frames Processed</div>
            <div className="card-value" style={{ fontSize: '1.25rem' }}>{metrics?.frame_count ?? 0}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
