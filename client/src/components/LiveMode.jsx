import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, Square, AlertTriangle, ShieldAlert, Activity, UserCheck, Shield, Eye, Compass, Car, Zap } from 'lucide-react'
import TopBar from './TopBar'
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

  // Compute ADAS Alert Status State
  const getAdasStatus = () => {
    if (!running) return { text: 'SYSTEM READY', badge: 'badge-info' }
    if (alarmActive) return { text: 'CRITICAL HAZARD ALARM', badge: 'badge-danger' }
    if (metrics?.collision_risk) return { text: 'COLLISION WARNING', badge: 'badge-danger' }
    if (metrics?.fatigue) return { text: 'FATIGUE DETECTED', badge: 'badge-warning' }
    if (metrics?.distraction) return { text: 'DISTRACTION DETECTED', badge: 'badge-warning' }
    if ((metrics?.speed_kmph ?? 0) > settings.speedLimit) return { text: 'OVERSPEED WARNING', badge: 'badge-warning' }
    return { text: 'SAFE OPERATIONAL', badge: 'badge-safe' }
  }

  const adasState = getAdasStatus()

  return (
    <div className="page-container">
      <TopBar 
        title="SSD DRIVEAI — REAL-TIME ADAS MONITOR" 
        subtitle="Live Driver Behavior & Safety Intelligence Cockpit"
      />

      {/* Active Session Driver Strip */}
      <div className="card card-accent-border mb-4" style={{ padding: '0.9rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img 
            src={activeDriver?.profile_photo || "https://api.dicebear.com/7.x/bottts/svg?seed=driver"} 
            alt={activeDriver?.full_name} 
            style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--border-accent)', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <UserCheck size={14} color="#00e676" /> Active Monitoring Session Driver
            </div>
            <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {activeDriver ? activeDriver.full_name : <span style={{ color: 'var(--danger)' }}>No Driver Selected</span>}
              {activeDriver && (
                <span className="driver-id-pill">{activeDriver.driver_id}</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`badge ${adasState.badge}`}>
            {adasState.text}
          </span>
        </div>
      </div>

      {/* Live Controls */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={start} disabled={running} style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}>
          <Camera size={16} /> START ADAS MONITOR
        </button>
        <button className="btn btn-danger" onClick={stop} disabled={!running} style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}>
          <Square size={16} /> STOP MONITORING
        </button>
        {running && (
          <span className="status-chip chip-online">
            <span className="status-dot"></span>
            <Activity size={14} /> LIVE CAMERA STREAMING
          </span>
        )}
      </div>

      {error && (
        <div className="card card-danger mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--danger)', fontWeight: 700 }}>
          <AlertTriangle size={20} /> {error}
        </div>
      )}

      {/* Alarm Banner */}
      {alarmActive && (
        <div className="card card-danger mb-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
          <ShieldAlert size={24} color="#ff334b" />
          <div>
            <strong style={{ color: '#ff334b', fontSize: '0.95rem', letterSpacing: '0.04em' }}>UNSAFE DRIVING / HAZARD DETECTED!</strong>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {(metrics.alarm_reasons || []).map((r, i) => <span key={i} style={{ marginRight: '0.75rem' }}>• {r}</span>)}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: ADAS Feed + Telemetry Sidebar */}
      <div className="command-grid" style={{ gridTemplateColumns: '2.2fr 1fr' }}>
        {/* Left Column: Live Frame Feed + Rolling Telemetry Charts */}
        <div>
          <div className="card mb-4" style={{ padding: '0.5rem', background: '#000000', border: alarmActive ? '2px solid var(--danger)' : '1px solid var(--border-accent)', minHeight: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {frame ? (
              <img src={frame} alt="Live ADAS Feed" style={{ width: '100%', maxHeight: '480px', objectFit: 'contain', borderRadius: 4 }} />
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <Camera size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {running ? 'CONNECTING TO ADAS STREAM…' : 'CAMERA STREAM INACTIVE — CLICK START ADAS MONITOR'}
                </p>
              </div>
            )}
          </div>

          {/* Rolling Telemetry History Charts */}
          {metrics && running && (
            <>
              <div className="chart-grid">
                <TimelineChart data={metrics.speed_history || []} title="Live Speed Telemetry" yLabel="km/h" dangerLine={settings.speedLimit} color="#0066ff" />
                <TimelineChart data={metrics.risk_history || []} title="Live Risk Index" yLabel="Score" dangerLine={0.6} color="#ffb300" />
              </div>
              <div className="chart-grid">
                <TimelineChart data={metrics.ear_history || []} title="Live Eye Aspect Ratio (EAR)" yLabel="EAR" dangerLine={settings.earThreshold} color="#00e676" />
                <TimelineChart data={metrics.danger_history || []} title="Collision Danger Level" yLabel="Danger" dangerLine={0.5} color="#ff334b" />
              </div>
            </>
          )}
        </div>

        {/* Right Column: ADAS Real-Time Telemetry Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.25rem' }}>
            <span className="card-title mb-2">LIVE RISK GAUGE</span>
            <RiskGauge score={metrics?.risk_score ?? 0} size={170} />
          </div>

          <div className="kpi-card card-accent-border">
            <span className="kpi-title">Live Speed</span>
            <div className="kpi-value-wrap">
              <span className="telemetry-number" style={{ color: (metrics?.speed_kmph ?? 0) > settings.speedLimit ? 'var(--danger)' : '#ffffff' }}>
                {(metrics?.speed_kmph ?? 0).toFixed(0)}
              </span>
              <span className="kpi-unit">km/h</span>
            </div>
            <span className="kpi-subtext">Limit: {settings.speedLimit} km/h</span>
          </div>

          <div className="kpi-card card-accent-border">
            <span className="kpi-title">Eye Aspect Ratio (EAR)</span>
            <div className="kpi-value-wrap">
              <span className="telemetry-number">{(metrics?.ear ?? 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="kpi-card card-accent-border">
            <span className="kpi-title">Fatigue State</span>
            <div className="kpi-value-wrap">
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: metrics?.fatigue ? 'var(--danger)' : 'var(--safe)' }}>
                {metrics?.fatigue ? '😴 DROWSY' : '✅ ALERT'}
              </span>
            </div>
          </div>

          <div className="kpi-card card-accent-border">
            <span className="kpi-title">Distraction State</span>
            <div className="kpi-value-wrap">
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: metrics?.distraction ? 'var(--danger)' : 'var(--safe)' }}>
                {metrics?.distraction ? '⚠️ DISTRACTED' : '✅ FOCUSED'}
              </span>
            </div>
          </div>

          <div className={`kpi-card card-accent-border ${metrics?.collision_risk ? 'card-danger' : ''}`}>
            <span className="kpi-title">Collision Hazard</span>
            <div className="kpi-value-wrap">
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: metrics?.collision_risk ? 'var(--danger)' : 'var(--safe)' }}>
                {metrics?.collision_risk ? '🚨 HAZARD' : '✅ CLEAR'}
              </span>
            </div>
            {metrics?.obstacle_detected && (
              <span className="kpi-subtext" style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {metrics.obstacle_count} obstacle{metrics.obstacle_count !== 1 ? 's' : ''} — {metrics.obstacle_label}
                {metrics.approaching && <span style={{ color: 'var(--danger)' }}> (approaching)</span>}
              </span>
            )}
          </div>

          <div className="kpi-card card-accent-border">
            <span className="kpi-title">Head Pose Orientation</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#ffffff', fontWeight: 700, marginTop: '0.2rem' }}>
              Yaw: {(metrics?.yaw ?? 0).toFixed(0)}° &nbsp;|&nbsp; Pitch: {(metrics?.pitch ?? 0).toFixed(0)}°
            </div>
          </div>

          <div className="kpi-card card-accent-border">
            <span className="kpi-title">Frames Processed</span>
            <div className="kpi-value-wrap">
              <span className="telemetry-number">{metrics?.frame_count ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
